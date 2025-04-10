import Link from 'next/link';

import Heading from '~/core/ui/Heading';
import configuration from '~/configuration';
import SignInMethodsContainer from '~/app/auth/components/SignInMethodsContainer';
import { useSearchParams } from 'next/navigation';

const SIGN_UP_PATH = configuration.paths.signUp;

export const metadata = {
  title: 'Sign In',
};

function SignInPage(
  {
    searchParams,
  }: {
    searchParams: { redirectUrl?: string };
  }
) {

  const redirectUrl = searchParams.redirectUrl;
  return (
    <>
      <div>
        <Heading type={5}>Sign In</Heading>
      </div>

      <SignInMethodsContainer redirectUrl={redirectUrl!} />

      <div className={'flex justify-center text-xs'}>
        <p className={'flex space-x-1'}>
          <span>Don&apos;t have an account?</span>

          <Link
            className={'text-primary-800 hover:underline dark:text-primary'}
            href={SIGN_UP_PATH}
          >
            Sign up
          </Link>
        </p>
      </div>
    </>
  );
}

export default SignInPage;
