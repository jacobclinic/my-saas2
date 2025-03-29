
// app/actions/public/student-class-register.ts
'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { rateLimit } from '../../../lib/rate-limit';
import getSupabaseServerActionClient from '../../../core/supabase/action-client';
import { getStudentCredentialsEmailTemplate } from '~/core/email/templates/student-credentials';
import { USERS_TABLE } from '~/lib/db-tables';
import sendEmail from '~/core/email/send-email';

const registrationSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  classId: z.string().uuid(),
  className: z.string().min(1),
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

    // get user details for email template
    const { data: userDetails, error: userError } = await client
      .from(USERS_TABLE)
      .select('first_name, last_name')
      .eq('id', userId)
      .single();
    

    const { html, text } = getStudentCredentialsEmailTemplate({
      studentName: `${userDetails?.first_name} ${userDetails?.last_name}`,
      email: validated.email,
      className: formData.className,
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
