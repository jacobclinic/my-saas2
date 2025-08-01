'use client';

import { useCallback } from 'react';

import useSignInWithEmailPassword from '~/core/hooks/use-sign-in-with-email-password';
import AuthErrorMessage from '~/app/auth/components/AuthErrorMessage';
import EmailPasswordSignInForm from '~/app/auth/components/EmailPasswordSignInForm';

const EmailPasswordSignInContainer: React.FCC<{
  onSignIn: (userId?: string) => unknown;
  redirectUrl?: string | null;
}> = ({ onSignIn, redirectUrl }) => {
  const signInMutation = useSignInWithEmailPassword();
  const isLoading = signInMutation.isMutating;

  const onSubmit = useCallback(
    async (credentials: { email: string; password: string }) => {
      try {
        const data = await signInMutation.trigger(credentials);
        const userId = data?.user?.id;

        // If we have a redirectUrl, use it directly instead of calling onSignIn
        if (redirectUrl) {
          window.location.href = redirectUrl;
        } else {
          onSignIn(userId);
        }
      } catch (e) {
        // wrong credentials, do nothing
      }
    },
    [onSignIn, signInMutation, redirectUrl],
  );

  return (
    <>
      <AuthErrorMessage error={signInMutation.error} />

      <EmailPasswordSignInForm onSubmit={onSubmit} loading={isLoading} />
    </>
  );
};

export default EmailPasswordSignInContainer;
