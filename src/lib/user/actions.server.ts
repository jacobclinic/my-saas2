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

      await sendEmail({
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
