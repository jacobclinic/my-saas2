import Link from 'next/link';
import Image from 'next/image';

import Heading from '~/core/ui/Heading';
import configuration from '~/configuration';
import SignInMethodsContainer from '~/app/auth/components/SignInMethodsContainer';
import { useSearchParams } from 'next/navigation';

const SIGN_UP_PATH = configuration.paths.signUp;

export const metadata = {
  title: 'Sign In',
};

function SignInPage({
  searchParams,
}: {
  searchParams: { redirectUrl?: string };
}) {
  const redirectUrl = searchParams.redirectUrl;
  return (
    <div
      className={
        'flex w-full max-w-md flex-col items-center space-y-4 rounded-xl border-transparent bg-white px-2 py-6 dark:bg-background dark:shadow-[0_0_1200px_0] dark:shadow-primary/30 md:w-8/12 md:border md:px-8 md:py-8 md:shadow-xl dark:md:border-dark-800 lg:px-6'
      }
    >
      <div className='flex w-full flex-col items-center pb-8'>            <Image 
              src="/assets/images/comaaas.png" 
              alt="Logo" 
              width={120} 
              height={120} 
              className="w-[95px] sm:w-[105px]"
            />
        <h1 className='mt-4 text-center text-xl sm:text-2xl font-bold text-gray-900'>Welcome Back</h1>
        <p className='mt-2 text-center text-sm sm:text-base text-gray-600'>Sign in to your Comma Education account</p>
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
    </div>
  );
}

export default SignInPage;
