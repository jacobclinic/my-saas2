'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { rateLimit } from '../../../lib/rate-limit';
import getSupabaseServerActionClient from '../../../core/supabase/action-client';
import sendEmail from '../../../core/email/send-email';
import { getStudentCredentialsEmailTemplate } from '../../../core/email/templates/student-credentials';

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

// Helper function to update user with retry
async function updateUserWithRetry(
  client: any,
  userId: string,
  updateData: any,
  maxRetries = 5,
  delay = 1000,
) {
  for (let i = 0; i < maxRetries; i++) {
    // Check if user exists
    const exists = await checkUserExists(client, userId);

    if (exists) {
      // User exists, proceed with update
      const { error } = await client
        .from('users')
        .update(updateData)
        .eq('id', userId);

      if (!error) return { success: true };
      throw error;
    }

    // User doesn't exist yet, wait before retrying
    await wait(delay);
  }

  throw new Error('Failed to update user after maximum retries');
}

const registrationSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(9),
  classId: z.string().uuid(),
  password: z.string().min(6),
  nameOfClass: z.string().min(1),
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
            temporary_password: password,
            user_role: 'student',
          },
        });

      if (authError) throw authError;
      userId = authUser.user.id;

      const { html, text } = getStudentCredentialsEmailTemplate({
        studentName: `${validated.firstName} ${validated.lastName}`,
        email: validated.email,
        className: validated.nameOfClass,
        loginUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/sign-in`,
      });

      // Send welcome email
      await sendEmail({
        from: process.env.EMAIL_SENDER || 'noreply@yourdomain.com',
        to: validated.email,
        subject: 'Welcome to Your Class - Login Credentials',
        html,
        text,
      });
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
