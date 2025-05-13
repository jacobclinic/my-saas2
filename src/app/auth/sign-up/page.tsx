import Link from 'next/link';

import Heading from '~/core/ui/Heading';
import SignUpMethodsContainer from '~/app/auth/components/SignUpMethodsContainer';

import configuration from '~/configuration';

const SIGN_IN_PATH = configuration.paths.signIn;

export const metadata = {
  title: 'Sign up',
};

function SignUpPage() {
  return (

    <div
      className={
        'flex w-full max-w-md flex-col items-center space-y-4 rounded-xl border-transparent bg-white px-2 py-1 dark:bg-background dark:shadow-[0_0_1200px_0] dark:shadow-primary/30 md:w-8/12 md:border md:px-8 md:py-2 md:shadow-xl dark:md:border-dark-800 lg:w-7/12 lg:px-6 xl:w-7/12 2xl:w-7/12'
      }
    >
      <div>
        <Heading type={5}>Create an account</Heading>
      </div>

      <SignUpMethodsContainer />

      <div className={'flex justify-center text-xs'}>
        <p className={'flex space-x-1'}>
          <span>Already have an account?</span>

          <Link
            className={'text-primary-800 hover:underline dark:text-primary'}
            href={SIGN_IN_PATH}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default SignUpPage;
