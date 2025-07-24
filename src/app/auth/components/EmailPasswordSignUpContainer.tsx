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
import { upsertUserDetails } from '~/lib/user/user-registration.server';

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
      phoneNumber: string;
      address: string;
    }) => {
      if (loading || redirecting.current) {
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

        // If successful signup, ensure user record exists in database with only basic info
        if (userId && email) {
          try {
            await upsertUserDetails({
              id: userId,
              first_name: params.firstName,
              last_name: params.lastName,
              address: params.address,
              phone_number: params.phoneNumber,
            });
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
          // Here we redirect the user to the moredetails page to complete their profile
          redirecting.current = true;

          // First sign in the user to create a valid session
          try {
            await signInMutation.trigger({
              email: params.email,
              password: params.password,
            });

            // Redirect to onboarding page
            router.push(configuration.paths.onboarding);

            // If onSignUp callback is provided, call it first
            if (onSignUp) {
              onSignUp();
            }
          } catch (signInError) {
            // If sign-in fails, redirect to sign-in page
            redirecting.current = false; // Reset on error
            router.push(configuration.paths.signIn);
          }
        }
      } catch (error) {
        redirecting.current = false; // Reset on error
        if (onError) {
          onError(error);
        }
      }
    },
    [
      loading,
      signUpMutation,
      signInMutation,
      router,
      onError,
      onSignUp,
      onSubmit,
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
