import useMutation from 'swr/mutation';
import useSupabase from './use-supabase';

interface Credentials {
  email: string;
  password: string;
}

/**
 * @name useSignInWithEmailPassword
 */
function useSignInWithEmailPassword() {
  const client = useSupabase();
  const key = ['auth', 'sign-in-with-email-password'];

  return useMutation(key, (_, { arg: credentials }: { arg: Credentials }) => {
    return client.auth.signInWithPassword(credentials).then((response) => {
      if (response.error) {
        // Handle specific auth error codes with more user-friendly messages
        if (response.error.message === 'Invalid login credentials') {
          throw 'The email or password you entered is incorrect. Please check your credentials and try again.';
        } else if (response.error.message.includes('Email not confirmed')) {
          throw 'Please confirm your email address before signing in. Check your inbox for a confirmation link.';
        } else {
          throw response.error.message;
        }
      }

      return response.data;
    });
  });
}

export default useSignInWithEmailPassword;
