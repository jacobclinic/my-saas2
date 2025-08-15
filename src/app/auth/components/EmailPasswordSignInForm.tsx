'use client';

import { useForm } from 'react-hook-form';
import Link from 'next/link';

import TextField from '~/core/ui/TextField';
import PasswordInput from '~/core/ui/PasswordInput';
import Button from '~/core/ui/Button';
import If from '~/core/ui/If';

const EmailPasswordSignInForm: React.FCC<{
  onSubmit: (params: { email: string; password: string }) => unknown;
  loading: boolean;
}> = ({ onSubmit, loading }) => {
  const { register, handleSubmit } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const emailControl = register('email', { required: true });
  const passwordControl = register('password', { required: true });

  return (
    <form className={'w-full'} onSubmit={handleSubmit(onSubmit)}>
      <div className={'flex-col space-y-4'}>
        <TextField>
          <TextField.Label  className='mb-1.5 block text-xs sm:text-sm font-medium text-gray-700'>
            Email
            <TextField.Input
              data-cy={'email-input'}
              required
              type="email"
              placeholder={'your@email.com'}
              {...emailControl}
              className='text-sm sm:text-base'
            />
          </TextField.Label>
        </TextField>

        <TextField>
          <TextField.Label  className='mb-1.5 block text-xs sm:text-sm font-medium text-gray-700'>
            Password
            <PasswordInput
              required
              data-cy={'password-input'}
              placeholder={''}
              {...passwordControl}
              className='text-sm sm:text-base'
            />
            <div className={'py-0.5 text-xs'}>
              <Link href={'/auth/password-reset'} className={'text-sm font-medium text-primary-800 hover:text-primary-700'}>
                Forgot password?
              </Link>
            </div>
          </TextField.Label>
        </TextField>

        <div>
          <Button
            className={'text-sm sm:text-base py-2 sm:py-2.5 bg-primary-800 text-white hover:bg-primary-700 focus:ring-primary-600/50 bg-gradient-to-br from-primary-700 to-primary-800 w-full'}
            data-cy="auth-submit-button"
            type="submit"
            loading={loading}
          >
            <If condition={loading} fallback={'Sign in'}>
              Signing in...
            </If>
          </Button>
        </div>
      </div>
    </form>
  );
};

export default EmailPasswordSignInForm;
