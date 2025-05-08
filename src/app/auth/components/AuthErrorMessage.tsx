import { AuthError } from '@supabase/gotrue-js';
import Alert from '~/core/ui/Alert';

const ERROR_CODES: StringObject = {
  'Invalid login credentials':
    'The email or password you entered is incorrect. Please check your credentials and try again.',
  'User already registered':
    'This email is already in use. Please try with another one.',
  'Email not confirmed':
    'Please confirm your email address before signing in. Check your inbox for a confirmation link.',
  'This email is already in use. Please try with another one.':
    'This email is already in use. Please try with another one.',
  'The email or password you entered is incorrect. Please check your credentials and try again.':
    'The email or password you entered is incorrect. Please check your credentials and try again.',
  default:
    'We have encountered an error. Please ensure you have a working internet connection and try again',
  generic: "Sorry, we weren't able to authenticate you. Please try again.",
  link: 'Sorry, we encountered an error while sending your link. Please try again.',
};

/**
 * @name AuthErrorMessage
 * @param error This error comes from Supabase as the code returned on errors
 * This error is mapped from the translation auth:errors.{error}
 * To update the error messages, please update the translation file
 * https://github.com/supabase/gotrue-js/blob/master/src/lib/errors.ts
 * @constructor
 */
export default function AuthErrorMessage({
  error,
}: {
  error: Maybe<Error | AuthError | unknown>;
}) {
  if (!error) {
    return null;
  }

  const errorCode =
    error instanceof AuthError ? error.message : (error as string);

  // Direct mapping for our custom error messages
  if (typeof errorCode === 'string' && errorCode in ERROR_CODES) {
    return (
      <Alert className={'w-full'} type={'error'}>
        <Alert.Heading>Authentication Error</Alert.Heading>
        <p className={'text-sm font-medium'} data-cy={'auth-error-message'}>
          {ERROR_CODES[errorCode]}
        </p>
      </Alert>
    );
  }

  return (
    <Alert className={'w-full'} type={'error'}>
      <Alert.Heading>Authentication Error</Alert.Heading>
      <p className={'text-sm font-medium'} data-cy={'auth-error-message'}>
        {typeof errorCode === 'string' && errorCode in ERROR_CODES
          ? ERROR_CODES[errorCode]
          : ERROR_CODES.default}
      </p>
    </Alert>
  );
}
