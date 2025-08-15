'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { rateLimit } from '../../../lib/rate-limit';
import getSupabaseServerActionClient from '../../../core/supabase/action-client';
import { USERS_TABLE } from '~/lib/db-tables';
import { sendSingleSMS } from '~/lib/notifications/sms/sms.notification.service';
import { createInvoiceForNewStudent } from '~/lib/invoices/database/mutations';
import { EmailService } from '~/core/email/send-email-mailtrap';
import { getStudentRegistrationEmailTemplate } from '~/core/email/templates/emailTemplate';

const registrationSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  classId: z.string().uuid(),
});

export async function registerStudentViaLoginAction(
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

    // Initialize Supabase client for server-side operations
    const client = getSupabaseServerActionClient({ admin: true });

    // Sign in the user using Supabase's server-side method
    const { data, error: signInError } = await client.auth.signInWithPassword({
      email: validated.email,
      password: validated.password,
    });

    if (signInError) {
      console.error('Sign-in error:', signInError.message);
      return { success: false, error: 'Sign-in failed. Please try again.' };
    }

    const userId = data?.user?.id;

    if (!userId) {
      return { success: false, error: 'User not found after sign-in.' };
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

      if (enrollmentError) {
        console.error('Enrollment error:', enrollmentError.message);
        throw enrollmentError;
      }

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
    } else {
      console.log(
        'Student is already enrolled in this class:',
        validated.classId,
      );
      return {
        success: false,
        error: 'Student is already enrolled in this class.',
      };
    }
    try {
      // get user details for email template
      const { data: userDetails, error: userError } = await client
        .from(USERS_TABLE)
        .select('first_name, last_name, phone_number')
        .eq('id', userId)
        .single();

      const { data: classData, error: classError } = await client
        .from('classes')
        .select('*')
        .eq('id', validated.classId)
        .single();

      if (classError) {
        console.error('Error fetching class data:', classError);
      }

      const { html, text } = getStudentRegistrationEmailTemplate({
        studentName: `${userDetails?.first_name} ${userDetails?.last_name}`,
        email: validated.email,
        className: classData?.name || 'Your Class',
        loginUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/sign-in`,
        classId: validated.classId,
      });
      const emailService = EmailService.getInstance();
      await Promise.all([
        // Send welcome email
        emailService.sendEmail({
          from: process.env.EMAIL_SENDER!,
          to: validated.email,
          subject: `Welcome to ${classData?.name || 'Your Class'}! Access Your Student Portal`,
          html,
          text,
        }),
        // send welcome sms
        sendSingleSMS({
          phoneNumber: userDetails?.phone_number!,
          message: `Welcome to ${classData?.name || 'Your Class'}! Access your student portal: ${process.env.NEXT_PUBLIC_SITE_URL}/auth/sign-in
                \nLogin with your registration email/password.
                \n-Comma Education`,
        }),
      ]);
    } catch (error) {
      console.error('Error sending email:', error);
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
