'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { rateLimit } from '../../../lib/rate-limit';
import getSupabaseServerActionClient from '../../../core/supabase/action-client';
import { sendSingleSMS } from '~/lib/notifications/sms/sms.notification.service';
import { createInvoiceForNewStudent } from '~/lib/invoices/database/mutations';
import { updateUserWithRetry } from '~/lib/user/actions.server';
import { EmailService } from '~/core/email/send-email-mailtrap';
import { getStudentRegistrationEmailTemplate } from '~/core/email/templates/emailTemplate';

// Helper function to wait
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper function to check if user exists in public table
async function checkUserExists(client: any, userId: string) {
  const { data, error } = await client
    .from('users')
    .select('id')
    .eq('id', userId)
    .single();

  return !!data;
}

const registrationSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(9),
  birthday: z.string().min(1),
  classId: z.string().uuid(),
  password: z.string().min(6),
  nameOfClass: z.string().min(1),
  address: z.string().min(2),
  city: z.string().min(1),
  district: z.string().min(1),
});

export async function registerStudentAction(
  formData: z.infer<typeof registrationSchema>,
) {
  try {
    // Rate limiting
    const identifier = formData.email.toLowerCase();
    const { success: rateOk } = await rateLimit(identifier);
    if (!rateOk) {
      return {
        success: false,
        error: 'Too many attempts. Please try again later.',
      };
    }

    // Validate input
    const validated = registrationSchema.parse(formData);

    const client = getSupabaseServerActionClient({ admin: true });

    // Check for existing user
    const { data: existingUser, error: searchError } = await client
      .from('users')
      .select('id')
      .eq('email', validated.email.toLowerCase())
      .single();

    if (searchError && searchError.code !== 'PGRST116') {
      // Ignore "not found" error
      throw searchError;
    }

    let userId: string;
    let password: string | undefined;

    if (existingUser?.id) {
      userId = existingUser.id;
      // Update their details
      await updateUserWithRetry(client, userId, {
        phone_number: validated.phone,
        first_name: validated.firstName,
        last_name: validated.lastName,
        birthday: validated.birthday,
        address: validated.address,
        city: validated.city,
        district: validated.district,
        user_role: 'student',
      });
    } else {
      // Create new user
      password = formData.password;
      const { data: authUser, error: authError } =
        await client.auth.admin.createUser({
          email: validated.email,
          password,
          email_confirm: true,
          user_metadata: {
            first_name: validated.firstName,
            last_name: validated.lastName,
            phone_number: validated.phone,
            birthday: validated.birthday,
            address: validated.address,
            city: validated.city,
            district: validated.district,
            user_role: 'student',
          },
        });

      if (authError) throw authError;
      userId = authUser.user.id;
    }

    // Check if student is already enrolled in this class
    const { data: existingEnrollment } = await client
      .from('student_class_enrollments')
      .select('id')
      .eq('student_id', userId)
      .eq('class_id', validated.classId)
      .single();

    if (!existingEnrollment) {
      // Create class enrollment only if not already enrolled
      const { error: enrollmentError } = await client
        .from('student_class_enrollments')
        .insert({
          student_id: userId,
          class_id: validated.classId,
          enrolled_date: new Date().toISOString(),
        });

      if (enrollmentError) throw enrollmentError;

      // Create invoice for the newly registered student
      const invoiceId = await createInvoiceForNewStudent(
        client,
        userId,
        validated.classId,
      );
      if (!invoiceId) {
        console.error('Failed to create invoice for student:', userId);
        // Continue with registration even if invoice creation fails
        // The system can generate missing invoices later with the monthly job
      }

      try {
        const { html, text } = getStudentRegistrationEmailTemplate({
          studentName: `${validated.firstName} ${validated.lastName}`,
          email: validated.email,
          className: validated.nameOfClass,
          loginUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/sign-in`,
          classId: validated.classId,
        });
        const emailService = EmailService.getInstance();
        await Promise.all([
          emailService.sendEmail({
            from: process.env.EMAIL_SENDER || 'noreply@yourdomain.com',
            to: validated.email,
            subject: ` Welcome to ${validated.nameOfClass}! Access Your Student Portal`,
            html,
            text,
          }),
          sendSingleSMS({
            phoneNumber: validated.phone,
            message: `Welcome to ${validated.nameOfClass}! Your registration is confirmed. Login to your student portal: ${process.env.NEXT_PUBLIC_SITE_URL}/auth/sign-in
                  \nUsername: Your email
                  \nUse the entered Password you used
                  \n-Comma Education`,
          }),
        ]);
      } catch (error) {
        console.error('Error sending email:', error);
      }
    }

    revalidatePath('/classes');
    return {
      success: true,
      userData: {
        userId,
        email: validated.email,
      },
    };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: 'Registration failed. Please try again.' };
  }
}
