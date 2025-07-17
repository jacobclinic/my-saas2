import useSWRMutation from 'swr/mutation';
import useSupabase from './use-supabase';
import configuration from '~/configuration';

interface Credentials {
  email: string;
  password: string;
  userRole: string;
}

interface PasswordValidationError {
  message: string;
  requirements: string[];
}

/**
 * Validates password strength according to security requirements
 * @param password - The password to validate
 * @returns true if valid, throws error with details if invalid
 */
function validatePassword(password: string): true {
  const minLength = 8;
  const hasLowerCase = /[a-z]/.test(password);
  const hasUpperCase = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  const missingRequirements: string[] = [];

  if (password.length < minLength) {
    missingRequirements.push(`At least ${minLength} characters`);
  }

  if (!hasLowerCase) {
    missingRequirements.push('At least one lowercase letter (a-z)');
  }

  if (!hasUpperCase) {
    missingRequirements.push('At least one uppercase letter (A-Z)');
  }

  if (!hasDigit) {
    missingRequirements.push('At least one digit (0-9)');
  }

  if (!hasSpecialChar) {
    // Temporarily comment out special character requirement for debugging
    // missingRequirements.push(
    //   'At least one special character (!@#$%^&*()_+-=[]{}|;\':",./<>?)',
    // );
  }

  if (missingRequirements.length > 0) {
    const error: PasswordValidationError = {
      message: 'Password does not meet security requirements',
      requirements: missingRequirements,
    };
    throw `Password must meet the following requirements:\n• ${missingRequirements.join('\n• ')}`;
  }

  return true;
}

/**
 * @name useSignUpWithEmailAndPassword
 */
function useSignUpWithEmailAndPassword() {
  const client = useSupabase();
  const key = ['auth', 'sign-up-with-email-password'];

  // Log client configuration
  console.log('🔵 Supabase client configured:', !!client);
  console.log('🔵 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing');
  console.log('🔵 Supabase Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing');

  return useSWRMutation(
    key,
    (_, { arg: credentials }: { arg: Credentials }) => {
      console.log('🔵 Starting signup process with credentials:', credentials);

      // Validate password before attempting signup
      try {
        validatePassword(credentials.password);
        console.log('✅ Password validation passed');
      } catch (validationError) {
        console.error('❌ Password validation failed:', validationError);
        return Promise.reject(validationError);
      }

      const emailRedirectTo = [
        window.location.origin,
        configuration.paths.authCallback,
      ].join('');

      console.log('🔵 Email redirect URL:', emailRedirectTo);
      console.log('🔵 Attempting Supabase signup...');

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
          console.log('🔵 Supabase signup response:', response);
          
          if (response.error) {
            console.error('❌ Supabase signup error:', response.error);
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

          console.log('🔵 User created:', user);
          console.log('🔵 User identities:', identities);

          // if the user has no identities, it means that the email is taken
          if (identities.length === 0) {
            console.error('❌ No identities found - email likely already in use');
            throw 'This email is already in use. Please try with another one.';
          }

          console.log('✅ Signup successful, returning data');
          return response.data;
        })
        .catch((error) => {
          console.error('❌ Signup process failed:', error);
          throw error;
        });
    },
  );
}

export default useSignUpWithEmailAndPassword;
