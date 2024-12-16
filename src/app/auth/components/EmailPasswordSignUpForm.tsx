import { useForm } from 'react-hook-form';
import { useState } from 'react';

import TextField from '~/core/ui/TextField';
import Button from '~/core/ui/Button';
import If from '~/core/ui/If';

const EmailPasswordSignUpForm: React.FCC<{
  onSubmit: (params: {
    email: string;
    password: string;
    repeatPassword: string;
    role: 'student' | 'tutor';
  }) => unknown;
  loading: boolean;
}> = ({ onSubmit, loading }) => {
  const { register, handleSubmit, watch, formState } = useForm({
    defaultValues: {
      email: '',
      password: '',
      repeatPassword: '',
    },
  });
  
  const [role, setRole] = useState<'student' | 'tutor'>('student'); // Default role

  const emailControl = register('email', { required: true });
  const errors = formState.errors;

  const passwordControl = register('password', {
    required: true,
    minLength: {
      value: 6,
      message: 'Please provide a password with at least 6 characters',
    },
  });

  const passwordValue = watch(`password`);

  const repeatPasswordControl = register('repeatPassword', {
    required: true,
    minLength: {
      value: 6,
      message: 'Please provide a password with at least 6 characters',
    },
    validate: (value) => {
      if (value !== passwordValue) {
        return 'The passwords do not match';
      }

      return true;
    },
  });

  return (
    <div className='w-full'>
      {/* Role Selection Tabs */}
      <div className="flex mb-4">
        <button
          type="button"
          className={`w-1/2 p-2 ${
            role === 'student' ? 'bg-primary text-white' : 'bg-gray-100'
          }`}
          onClick={() => setRole('student')}
        >
          Student
        </button>
        <button
          type="button"
          className={`w-1/2 p-2 ${
            role === 'tutor' ? 'bg-primary text-white' : 'bg-gray-100'
          }`}
          onClick={() => setRole('tutor')}
        >
          Tutor
        </button>
      </div>
      <form className={'w-full'} onSubmit={handleSubmit((data) => onSubmit({ ...data, role }))}>
        <div className={'flex-col space-y-4'}>
          <TextField>
            <TextField.Label>
              Email
              <TextField.Input
                {...emailControl}
                data-cy={'email-input'}
                required
                type="email"
                placeholder={'your@email.com'}
              />
            </TextField.Label>

            <TextField.Error error={errors.email?.message} />
          </TextField>

          <TextField>
            <TextField.Label>
              Password
              <TextField.Input
                {...passwordControl}
                data-cy={'password-input'}
                required
                type="password"
                placeholder={''}
              />
              <TextField.Hint>
                Ensure it&apos;s at least 6 characters
              </TextField.Hint>
              <TextField.Error
                data-cy="password-error"
                error={errors.password?.message}
              />
            </TextField.Label>
          </TextField>

          <TextField>
            <TextField.Label>
              Repeat Password
              <TextField.Input
                {...repeatPasswordControl}
                data-cy={'repeat-password-input'}
                required
                type="password"
                placeholder={''}
              />
              <TextField.Hint>Type your password again</TextField.Hint>
              <TextField.Error
                data-cy="repeat-password-error"
                error={errors.repeatPassword?.message}
              />
            </TextField.Label>
          </TextField>

          <div>
            <Button
              data-cy={'auth-submit-button'}
              className={'w-full'}
              type="submit"
              loading={loading}
            >
              <If condition={loading} fallback={`Get Started`}>
                Signing up...
              </If>
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EmailPasswordSignUpForm;
