import useSWRMutation from 'swr/mutation';
import useSupabase from './use-supabase';
import configuration from '~/configuration';
import { validatePasswordLegacy } from '../utils/validate-password';

interface Credentials {
  email: string;
  password: string;
  userRole: string;
}

/**
 * @name useSignUpWithEmailAndPassword
 */
function useSignUpWithEmailAndPassword() {
  const client = useSupabase();
  const key = ['auth', 'sign-up-with-email-password'];

  return useSWRMutation(
    key,
    (_, { arg: credentials }: { arg: Credentials }) => {
      // Validate password before attempting signup
      try {
        validatePasswordLegacy(credentials.password);
      } catch (validationError) {
        return Promise.reject(validationError);
      }

      const emailRedirectTo = [
        window.location.origin,
        configuration.paths.authCallback,
      ].join('');

      return client.auth
        .signUp({
          email: credentials.email,
          password: credentials.password,
          options: {
            emailRedirectTo,
            data: {
              user_role: credentials.userRole, // Store role in Supabase Auth metadata
            },
          },
        })
        .then((response) => {
          if (response.error) {
            // Handle specific error cases with user-friendly messages
            if (response.error.message.includes('already registered')) {
              throw 'This email is already in use. Please try with another one.';
            } else if (response.error.message.includes('password')) {
              // Check if it's a password strength error from Supabase
              if (response.error.message.includes('Password should be')) {
                throw `Password requirements not met: ${response.error.message}`;
              } else {
                throw response.error.message; // Pass through other password-related errors
              }
            } else {
              throw response.error.message;
            }
          }

          const user = response.data?.user;
          const identities = user?.identities ?? [];

          // if the user has no identities, it means that the email is taken
          if (identities.length === 0) {
            throw 'This email is already in use. Please try with another one.';
          }

          return response.data;
        });
    },
  );
}

export default useSignUpWithEmailAndPassword;
