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
  const client = getSupabaseServerActionClient({ admin: true });
  const { email, userRole } = params.userData;

  const password = generateSecurePassword();

  // Sign up the user
  const { data, error } = await client.auth.admin.createUser({
    email,
    password: "Test@1234",
    user_metadata: {
      userRole, // Store the role in metadata
    },
    email_confirm: true,
  });

  if (error) {
    console.error('Failed to create user:', error);
    throw new Error(`Failed to create user: ${error.message}`);
  }

  // Send welcome email with credentials
  try {
    // await sendEmail({
    //   from: configuration.email.fromAddress || 'noreply@yourinstitute.com',
    //   to: email,
    //   subject: 'Your New Account Credentials',
    //   html: `
    //     <p>Dear User,</p>
    //     <p>An account has been created for you with the following credentials:</p>
    //     <p><strong>Email:</strong> ${email}</p>
    //     <p><strong>Temporary Password:</strong> ${password}</p>
    //     <p>Please log in and change your password immediately.</p>
    //     <p>Best regards,<br>Your Institute Admin Team</p>
    //   `,
    // });
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
    user: data.user,
  };
};
