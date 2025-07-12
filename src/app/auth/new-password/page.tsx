import Link from 'next/link';
import Heading from '~/core/ui/Heading';
import configuration from '~/configuration';
import NewPasswordForm from '../components/NewPasswordForm';

export const metadata = {
  title: 'Reset Password',
};

function NewPasswordPage() {
  return (
    <div
      className={
        'flex w-full max-w-md flex-col items-center space-y-4 rounded-xl border-transparent bg-white px-2 py-1 dark:bg-background dark:shadow-[0_0_1200px_0] dark:shadow-primary/30 md:w-8/12 md:border md:px-8 md:py-6 md:shadow-xl dark:md:border-dark-800 lg:w-8/12 lg:px-6 xl:w-8/12 2xl:w-8/12'
      }
    >
      <div className="text-center">
        <Heading type={5}>Reset Your Password</Heading>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Enter your new password below
        </p>
      </div>

      <div className={'flex flex-col space-y-4 w-full'}>
        <NewPasswordForm />

        <div className={'flex justify-center text-xs'}>
          <p className={'flex space-x-1'}>
            <span>Remember your password?</span>

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

export default NewPasswordPage;
