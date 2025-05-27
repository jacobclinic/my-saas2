'use server';

import { redirect } from 'next/navigation';

import { deleteUser } from '~/lib/server/user/delete-user';
import getLogger from '~/core/logger';

import requireSession from '~/lib/user/require-session';
import getSupabaseServerActionClient from '~/core/supabase/action-client';
import sendEmail from '~/core/email/send-email';
import configuration from '~/configuration';
import { revalidatePath } from 'next/cache';
import { USER_ROLES } from '../constants';
import { generateSecurePassword } from '../utility-functions';
import UserType from './types/user';
import { getUserCredentialsEmailTemplate } from '~/core/email/templates/user-credentials';
import { getStudentCredentialsEmailTemplate } from '~/core/email/templates/student-credentials';
import { withSession } from '~/core/generic/actions-utils';
import { fetchUserRole } from './database/queries';
import { EmailService } from '~/core/email/send-email-mailtrap';

export async function deleteUserAccountAction() {
  const logger = getLogger();
  const client = getSupabaseServerActionClient();
  const { user } = await requireSession(client);

  logger.info({ userId: user.id }, `User requested to delete their account`);

  await deleteUser({
    client,
    userId: user.id,
    email: user.email,
    sendEmail: true,
  });

  await client.auth.signOut();

  redirect('/');
}


type CreateUserByAdminActionParams = {
  userData: Omit<UserType, 'id'>;
  csrfToken: string;
};

export const createUserByAdminAction = async (params: CreateUserByAdminActionParams) => {
  try {
    const client = getSupabaseServerActionClient({ admin: true });
    const { email, user_role, first_name, last_name } = params.userData;

    const userRole = user_role || 'tutor';

    // First check if user already exists in public users table
    const { data: existingUser, error: searchError } = await client
      .from('users')
      .select('id')
      .eq('email', email?.toLowerCase() || '')
      .single();

    if (searchError && searchError.code !== 'PGRST116') { // Ignore "not found" error
      throw searchError;
    }

    let userId: string;
    const password = generateSecurePassword();

    if (existingUser?.id) {
      // User exists, use their ID
      userId = existingUser.id;
      
      // Update their details
      const { error: updateError } = await client
        .from('users')
        .update({
          first_name,
          last_name,
          user_role: userRole,
        })
        .eq('id', userId);

      if (updateError) throw updateError;

    } else {
      // User doesn't exist, create new auth user
      const { data, error: createError } = await client.auth.admin.createUser({
        email,
        password,
        user_metadata: {
          first_name,
          last_name,
          user_role: userRole,
          temporary_password: password
        },
        email_confirm: true,
      });

      if (createError) throw createError;
      userId = data.user.id;
    }

    // Send welcome email with credentials
    try {
      const { html, text } = getUserCredentialsEmailTemplate({
        userName: `${first_name} ${last_name}`,
        email: email || '',
        password,
        userRole: userRole,
        loginUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/sign-in`
      });
      const emailService = EmailService.getInstance();
      await emailService.sendEmail({
        from: configuration.email.fromAddress || 'noreply@yourinstitute.com',
        to: email || '',
        subject: `Welcome to Your ${userRole.charAt(0).toUpperCase() + userRole.slice(1)} Account`,
        html,
        text,
      });
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
      throw new Error('User created, but failed to send email.');
    }

    // Revalidate paths
    if (userRole === USER_ROLES.TUTOR) {
      revalidatePath('/tutors');
      revalidatePath('/(app)/tutors');
    }
    if (userRole === USER_ROLES.STUDENT) {
      revalidatePath('/students');
      revalidatePath('/(app)/students');
    }

    return {
      success: true,
      userId,
    };

  } catch (error) {
    console.error('Error creating user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred.'
    };
  }
};

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
export async function updateUserWithRetry(
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

interface DeleteStudentEnrollmentParams {
  enrollmentId: string
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

    // First check if user already exists in public users table
    const { data: existingUser, error: searchError } = await client
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (searchError && searchError.code !== 'PGRST116') { // Ignore "not found" error
      throw searchError;
    }

    let userId: string;

    if (existingUser?.id) {
      // User exists, use their ID
      userId = existingUser.id;
      
      // Update their details
      await updateUserWithRetry(
        client,
        userId,
        {
          phone_number: phone,
          first_name: firstName,
          last_name: lastName,
          user_role: 'student',
        }
      );
    } else {
      const password = generateSecurePassword();

      // User doesn't exist, Create auth user with Supabase Admin
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
      userId = authUser.user.id;

      // Update user with retry mechanism
      await updateUserWithRetry(
        client,
        userId,
        {
          phone_number: phone,
          first_name: firstName,
          last_name: lastName,
          user_role: 'student',
        }
      );

      // Send welcome email with credentials
      const { html, text } = getStudentCredentialsEmailTemplate({
        studentName: `${firstName} ${lastName}`,
        email,
        className: nameOfClass,
        loginUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/sign-in`
      });
      const emailService = EmailService.getInstance();
      await emailService.sendEmail({
        from: process.env.EMAIL_SENDER! ,
        to: email,
        subject: 'Welcome to Your Class - Login Credentials',
        html,
        text
      });
    }

    // Check if student is already enrolled in this class
    const { data: existingEnrollment } = await client
      .from('student_class_enrollments')
      .select('id')
      .eq('student_id', userId)
      .eq('class_id', classId)
      .single();

    if (!existingEnrollment) {
      // Create class enrollment only if not already enrolled
      const { error: enrollmentError } = await client
        .from('student_class_enrollments')
        .insert({
          student_id: userId,
          class_id: classId,
          enrolled_date: new Date().toISOString()
        });

      if (enrollmentError) throw enrollmentError;
    }

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

export async function deleteStudentEnrollment({
  enrollmentId,
}: DeleteStudentEnrollmentParams) {
  try {
    const client = getSupabaseServerActionClient({ admin: true });

    // Check if student is already enrolled in this class
    const { data: existingEnrollment } = await client
      .from('student_class_enrollments')
      .select('id')
      .eq('id', enrollmentId)
      .single();

    if (existingEnrollment) {
      // Create class enrollment only if not already enrolled
      const { error: dbError } = await client
        .from('student_class_enrollments')
        .delete()
        .eq('id', enrollmentId)

      if (dbError) throw dbError;
    }

    revalidatePath('/classes');
    revalidatePath('/(app)/classes');
  } catch (error) {
    console.error('Error deleting enrollment student:', error);
  }
}

export const getUserRoleAction = withSession(
  async (userId : string ) => {
    
    const client = getSupabaseServerActionClient();
    const data = await fetchUserRole(client, userId);
    if (!data) {
      console.error('Error fetching user role:');
      return null;
    }

    return data;
  }

)
