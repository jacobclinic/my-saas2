'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthErrorMessage from './AuthErrorMessage';
import useSignUpWithEmailAndPasswordMutation from '~/core/hooks/use-sign-up-with-email-password';
import If from '~/core/ui/If';
import Alert from '~/core/ui/Alert';
import { ensureUserRecord } from '../sign-up/moredetails/actions';

import EmailPasswordSignUpForm from '~/app/auth/components/EmailPasswordSignUpForm';

import configuration from '~/configuration';

const requireEmailConfirmation = configuration.auth.requireEmailConfirmation;

const EmailPasswordSignUpContainer: React.FCC<{
  onSignUp?: () => unknown;
  onSubmit?: (userId?: string) => void;
  onError?: (error?: unknown) => unknown;
}> = ({ onSignUp, onSubmit, onError }) => {
  const router = useRouter();
  const signUpMutation = useSignUpWithEmailAndPasswordMutation();
  const redirecting = useRef(false);
  const loading = signUpMutation.isMutating || redirecting.current;
  const [showVerifyEmailAlert, setShowVerifyEmailAlert] = useState(false);

  const callOnErrorCallback = useCallback(() => {
    if (signUpMutation.error && onError) {
      onError(signUpMutation.error);
    }
  }, [signUpMutation.error, onError]);

  useEffect(() => {
    callOnErrorCallback();
  }, [callOnErrorCallback]);

  const onSignupRequested = useCallback(
    async (params: { email: string; password: string; userRole: string }) => {
      console.log('onSignupRequested-params', params);
      if (loading) {
        return;
      }

      try {
        const data = await signUpMutation.trigger(params);
        const userId = data?.user?.id;
        const email = data?.user?.email || params.email;

        // If successful signup, ensure user record exists in database
        if (userId && email) {
          try {
            await ensureUserRecord(userId, email, params.userRole);
          } catch (error) {
            console.error('Failed to create user record:', error);
          }
        }

        // If the user is required to confirm their email, we display a message
        if (requireEmailConfirmation) {
          setShowVerifyEmailAlert(true);

          if (onSubmit) {
            onSubmit(userId);
          }
        } else {
          // Here we redirect the user to the moredetails page to collect additional information
          redirecting.current = true;

          // If onSignUp callback is provided, call it first
          if (onSignUp) {
            onSignUp();
          }

          // Then redirect to the moredetails page
          router.push('/auth/sign-up/moredetails');
        }
      } catch (error) {
        if (onError) {
          onError(error);
        }
      }
    },
    [loading, onError, onSignUp, onSubmit, signUpMutation, router],
  );

  return (
    <>
      <If condition={showVerifyEmailAlert}>
        <Alert type={'success'}>
          <Alert.Heading>We sent you a confirmation email.</Alert.Heading>

          <p data-cy={'email-confirmation-alert'}>
            Welcome! Please check your email and click the link to verify your
            account.
          </p>
        </Alert>
      </If>

      <If condition={!showVerifyEmailAlert}>
        <AuthErrorMessage error={signUpMutation.error} />

        <EmailPasswordSignUpForm
          onSubmit={onSignupRequested}
          loading={loading}
        />
      </If>
    </>
  );
};

export default EmailPasswordSignUpContainer;
