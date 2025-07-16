'use server';
import { z } from 'zod';
import getSupabaseServerActionClient from '~/core/supabase/action-client';

const updatePasswordSchema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    token_hash: z.string().min(1, 'Recovery token is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export async function updatePasswordAction(formData: FormData) {
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;
  const token_hash = formData.get('token_hash') as string;

  // Validate the form data
  const validation = updatePasswordSchema.safeParse({
    password,
    confirmPassword,
    token_hash,
  });

  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || 'Invalid form data',
    };
  }

  try {
    const client = getSupabaseServerActionClient();

    // Use the verify OTP method for password recovery
    const { error: verifyError } = await client.auth.verifyOtp({
      token_hash,
      type: 'recovery',
    });

    if (verifyError) {
      return {
        success: false,
        error: 'Invalid or expired reset link',
      };
    }

    // Update the user's password
    const { error: updateError } = await client.auth.updateUser({
      password: validation.data.password,
    });

    if (updateError) {
      return {
        success: false,
        error: updateError.message,
      };
    }

    // Sign out the user to clear the session
    await client.auth.signOut();

    return {
      success: true,
      message: 'Password updated successfully',
    };
  } catch (error) {
    console.error('Password update error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}
