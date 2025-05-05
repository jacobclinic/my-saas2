import Link from 'next/link';

import configuration from '~/configuration';
import Heading from '~/core/ui/Heading';

import PasswordResetContainer from '~/app/auth/components/PasswordResetContainer';

export const metadata = {
  title: 'Password Reset',
};

function PasswordResetPage() {
  return (
    <div
      className={
        'flex w-full max-w-md flex-col items-center space-y-4 rounded-xl border-transparent bg-white px-2 py-1 dark:bg-background dark:shadow-[0_0_1200px_0] dark:shadow-primary/30 md:w-8/12 md:border md:px-8 md:py-6 md:shadow-xl dark:md:border-dark-800 lg:w-8/12 lg:px-6 xl:w-8/12 2xl:w-8/12'
      }
    >
      <div>
        <Heading type={5}>Reset your Password</Heading>
      </div>

      <div className={'flex flex-col space-y-4'}>
        <PasswordResetContainer />

        <div className={'flex justify-center text-xs'}>
          <p className={'flex space-x-1'}>
            <span>Have you recovered your password?</span>

            <Link
              className={'text-primary-800 hover:underline dark:text-primary'}
              href={configuration.paths.signIn}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default PasswordResetPage;
