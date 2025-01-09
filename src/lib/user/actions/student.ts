'use server'

import { revalidatePath } from 'next/cache';
import configuration from '~/configuration';
import sendEmail from '~/core/email/send-email';
import { getStudentCredentialsEmailTemplate } from '~/core/email/templates/student-credentials';
import getSupabaseServerActionClient from '~/core/supabase/action-client';
import { generateSecurePassword } from '~/lib/utility-functions';

// Helper function to wait
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
  delay = 1000
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

interface CreateStudentParams {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  classId: string;
  nameOfClass: string;
  csrfToken: string;
}

export async function createStudentAction({
  firstName,
  lastName,
  email,
  phone,
  classId,
  nameOfClass,
  csrfToken
}: CreateStudentParams) {
  try {
    const client = getSupabaseServerActionClient({ admin: true });

    // Generate a random password
    const password = generateSecurePassword();

    // Create auth user with Supabase Admin
    const { data: authUser, error: authError } = await client.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        phone_number: phone,
        temporary_password: password,
        user_role: 'student'
      },
      email_confirm: true,
    });

    if (authError) throw authError;

    // Update user with retry mechanism
    await updateUserWithRetry(
      client,
      authUser.user.id,
      {
        phone_number: phone,
        first_name: firstName,
        last_name: lastName,
        user_role: 'student',
      }
    );

    // Create class enrollment with retry mechanism
    await updateUserWithRetry(
      client,
      authUser.user.id,
      {},  // Empty update, just checking existence
      5,    // maxRetries
      1000  // delay in ms
    );

    const { error: enrollmentError } = await client
      .from('student_class_enrollments')
      .insert({
        student_id: authUser.user.id,
        class_id: classId,
        enrolled_date: new Date().toISOString()
      });

    if (enrollmentError) throw enrollmentError;

    // Send welcome email with credentials
    const { html, text } = getStudentCredentialsEmailTemplate({
      studentName: `${firstName} ${lastName}`,
      email,
      password,
      className: nameOfClass,
      loginUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/sign-in`
    });

    // await sendEmail({
    //   // from: process.env.EMAIL_FROM || 'noreply@yourdomain.com',
    //   from: 'onboarding@resend.dev',
    //   to: email,
    //   subject: 'Welcome to Your Class - Login Credentials',
    //   html,
    //   text
    // });

    revalidatePath('/classes');
    revalidatePath('/(app)/classes');

    return { success: true, error: null };

  } catch (error) {
    console.error('Error creating student:', error);
    return {
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred.' 
    };
  }
}