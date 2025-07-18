'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthErrorMessage from './AuthErrorMessage';
import useSignUpWithEmailAndPasswordMutation from '~/core/hooks/use-sign-up-with-email-password';
import useSignInWithEmailPassword from '~/core/hooks/use-sign-in-with-email-password';
import If from '~/core/ui/If';
import Alert from '~/core/ui/Alert';

import EmailPasswordSignUpForm from '~/app/auth/components/EmailPasswordSignUpForm';

import configuration from '~/configuration';
import { ensureUserRecord } from '../sign-up/moredetails/actions';

const requireEmailConfirmation = configuration.auth.requireEmailConfirmation;

const EmailPasswordSignUpContainer: React.FCC<{
  onSignUp?: () => unknown;
  onSubmit?: (userId?: string) => void;
  onError?: (error?: unknown) => unknown;
}> = ({ onSignUp, onSubmit, onError }) => {
  const router = useRouter();
  const signUpMutation = useSignUpWithEmailAndPasswordMutation();
  const signInMutation = useSignInWithEmailPassword();
  const redirecting = useRef(false);
  const loading =
    signUpMutation.isMutating ||
    signInMutation.isMutating ||
    redirecting.current;
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
    async (params: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      userRole: string;
    }) => {
      // console.log('onSignupRequested-params', params);
      if (loading) {
        return;
      }

      try {
        const data = await signUpMutation.trigger({
          email: params.email,
          password: params.password,
          userRole: params.userRole,
        });
        const userId = data?.user?.id;
        const email = data?.user?.email || params.email;

        // If successful signup, ensure user record exists in database with name fields
        if (userId && email) {
          try {
            await ensureUserRecord(
              userId,
              email,
              params.userRole,
              params.firstName,
              params.lastName,
            );
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

          // First sign in the user to create a valid session
          try {
            await signInMutation.trigger({
              email: params.email,
              password: params.password,
            });

            // If onSignUp callback is provided, call it first
            if (onSignUp) {
              onSignUp();
            }

            // Then redirect to the moredetails page
            router.push('/auth/sign-up/moredetails');
          } catch (signInError) {
            // If sign-in fails, redirect to sign-in page
            router.push(configuration.paths.signIn);
          }
        }
      } catch (error) {
        if (onError) {
          onError(error);
        }
      }
    },
    [
      loading,
      onError,
      onSignUp,
      onSubmit,
      signUpMutation,
      signInMutation,
      router,
    ],
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
