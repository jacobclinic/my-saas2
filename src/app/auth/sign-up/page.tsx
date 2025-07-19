import Link from 'next/link';
import Image from 'next/image';

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
        'flex w-full max-w-md flex-col items-center space-y-4 rounded-xl border-transparent bg-white px-6 py-6 dark:bg-background dark:shadow-[0_0_1200px_0] dark:shadow-primary/30 md:w-8/12 md:border md:px-8 md:py-8 md:shadow-xl dark:md:border-dark-800 lg:px-6'
      }
    >
      <div className="flex w-full flex-col items-center pb-8">
        {' '}
        <Image
          src="/assets/images/comaaas.png"
          alt="Logo"
          width={120}
          height={120}
          className="w-[95px] sm:w-[105px]"
        />
        <h1 className="mt-4 text-center text-xl sm:text-2xl font-bold text-gray-900">
          Create your account
        </h1>
        <p className="mt-2 text-center text-sm sm:text-base text-gray-600">
          Join Comma Education to start learning online
        </p>
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
