import useSWRMutation from 'swr/mutation';
import useSupabase from './use-supabase';
import configuration from '~/configuration';

interface Credentials {
  email: string;
  password: string;
  role:string
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
      console.log("onSignupRequested-params", credentials);
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
              role: credentials.role, // Store role in Supabase Auth metadata
            },
          },
        })
        .then((response) => {
          if (response.error) {
            throw response.error.message;
          }

          const user = response.data?.user;
          const identities = user?.identities ?? [];

          // if the user has no identities, it means that the email is taken
          if (identities.length === 0) {
            throw new Error('User already registered');
          }

          return response.data;
        });
    },
  );
}

export default useSignUpWithEmailAndPassword;
