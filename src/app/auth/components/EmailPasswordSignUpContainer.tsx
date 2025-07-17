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
      console.log('🔵 SignUp container - onSignupRequested called with params:', params);
      
      if (loading) {
        console.log('❌ SignUp already in progress, skipping...');
        return;
      }

      try {
        console.log('🔵 Triggering signup mutation...');
        const data = await signUpMutation.trigger({
          email: params.email,
          password: params.password,
          userRole: params.userRole,
        });
        
        console.log('✅ Signup mutation successful, data:', data);
        
        const userId = data?.user?.id;
        const email = data?.user?.email || params.email;

        console.log('🔵 Extracted userId:', userId, 'email:', email);

        // If successful signup, ensure user record exists in database with name fields
        if (userId && email) {
          try {
            console.log('🔵 Attempting to upsert user details...');
            await upsertUserDetails({
              id: userId,
              first_name: params.firstName,
              last_name: params.lastName,
              phone_number: params.phoneNumber,
              address: params.address,
            });
            console.log('✅ User details upserted successfully');
          } catch (error) {
            console.error('❌ Failed to create user record:', error);
          }
        }

        // If the user is required to confirm their email, we display a message
        if (requireEmailConfirmation) {
          console.log('🔵 Email confirmation required, showing alert');
          setShowVerifyEmailAlert(true);

          if (onSubmit) {
            onSubmit(userId);
          }
        } else {
          console.log('🔵 No email confirmation required, proceeding with sign-in');
          // Here we redirect the user to the moredetails page to collect additional information
          redirecting.current = true;

          // First sign in the user to create a valid session
          try {
            console.log('🔵 Attempting to sign in user after signup...');
            await signInMutation.trigger({
              email: params.email,
              password: params.password,
            });
            console.log('✅ Sign-in after signup successful');

            // If onSignUp callback is provided, call it first
            if (onSignUp) {
              console.log('🔵 Calling onSignUp callback');
              onSignUp();
            }
          } catch (signInError) {
            console.error('❌ Sign-in after signup failed:', signInError);
            // If sign-in fails, redirect to sign-in page
            router.push(configuration.paths.signIn);
          }
        }
      } catch (error) {
        console.error('❌ Signup process failed:', error);
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
