import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';

import TextField from '~/core/ui/TextField';
import Button from '~/core/ui/Button';
import If from '~/core/ui/If';

const EmailPasswordSignUpForm: React.FCC<{
  onSubmit: (params: {
    email: string;
    password: string;
    repeatPassword: string;
    userRole: 'student' | 'tutor';
  }) => unknown;
  loading: boolean;
}> = ({ onSubmit, loading }) => {
  const { register, handleSubmit, watch, formState, trigger } = useForm({
    defaultValues: {
      email: '',
      password: '',
      repeatPassword: '',
    },
    mode: 'onChange',
  });

  const [userRole, setUserRole] = useState<'student' | 'tutor'>('student'); // Default userRole

  const emailControl = register('email', { required: true });
  const errors = formState.errors;

  // Re-validate password when user role changes
  useEffect(() => {
    trigger('password');
    trigger('repeatPassword');
  }, [userRole, trigger]);

  const passwordControl = register('password', {
    required: true,
    minLength: {
      value: 6,
      message: 'Please provide a password with at least 6 characters',
    },
    validate: (value) => {
      // Additional password complexity for tutors
      if (userRole === 'tutor') {
        const hasLowercase = /[a-z]/.test(value);
        const hasUppercase = /[A-Z]/.test(value);
        const hasDigit = /\d/.test(value);
        const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(
          value,
        );

        if (!hasLowercase) {
          return 'Password must contain at least one lowercase letter';
        }

        if (!hasUppercase) {
          return 'Password must contain at least one uppercase letter';
        }

        if (!hasDigit) {
          return 'Password must contain at least one digit';
        }

        if (!hasSpecialChar) {
          return 'Password must contain at least one special character';
        }
      }

      return true;
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
    <div className="w-full">
      {/* Role Selection Tabs */}
      <div className="flex mb-4">
        <button
          type="button"
          className={`w-1/2 p-2 ${
            userRole === 'student' ? 'bg-primary text-white' : 'bg-gray-100'
          }`}
          onClick={() => setUserRole('student')}
        >
          Student
        </button>
        <button
          type="button"
          className={`w-1/2 p-2 ${
            userRole === 'tutor' ? 'bg-primary text-white' : 'bg-gray-100'
          }`}
          onClick={() => setUserRole('tutor')}
        >
          Tutor
        </button>
      </div>
      <form
        className={'w-full'}
        onSubmit={handleSubmit((data) => onSubmit({ ...data, userRole }))}
        autoComplete="off"
      >
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
                autoComplete="new-email"
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
                autoComplete="new-password"
              />
              <TextField.Hint>
                {userRole === 'student'
                  ? "Ensure it's at least 6 characters"
                  : '6+ characters includes lowercase, uppercase, digit, special character'}
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
                autoComplete="new-password"
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
