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
    firstName: string;
    lastName: string;
    userRole: 'student' | 'tutor';
  }) => unknown;
  loading: boolean;
}> = ({ onSubmit, loading }) => {
  const { register, handleSubmit, watch, formState, trigger } = useForm({
    defaultValues: {
      email: '',
      password: '',
      repeatPassword: '',
      firstName: '',
      lastName: '',
    },
    mode: 'onChange',
  });

  const [userRole, setUserRole] = useState<'student' | 'tutor'>('student'); // Default userRole

  const emailControl = register('email', { required: true });
  const firstNameControl = register('firstName', { 
    required: true,
    minLength: {
      value: 2,
      message: 'First name must be at least 2 characters',
    },
    validate: (value) => {
      if (/\d/.test(value)) {
        return 'First name cannot contain numbers';
      }
      return true;
    },
  });
  const lastNameControl = register('lastName', { 
    required: true,
    minLength: {
      value: 2,
      message: 'Last name must be at least 2 characters',
    },
    validate: (value) => {
      if (/\d/.test(value)) {
        return 'Last name cannot contain numbers';
      }
      return true;
    },
  });
  const errors = formState.errors;

  // Re-validate password when user role changes
  useEffect(() => {
    trigger('password');
    trigger('repeatPassword');
  }, [userRole, trigger]);

  const passwordControl = register('password', {
    required: true,
    minLength: {
      value: 8,
      message: 'Please provide a password with at least 8 characters',
    },
    validate: (value) => {

      const hasLowercase = /[a-z]/.test(value);
      const hasUppercase = /[A-Z]/.test(value);
      const hasDigit = /\d/.test(value);

      if (!hasLowercase) {
        return 'Password must contain at least one lowercase letter';
      }

      if (!hasUppercase) {
        return 'Password must contain at least one uppercase letter';
      }

      if (!hasDigit) {
        return 'Password must contain at least one digit';
      }

      return true;
    },
  });

  const passwordValue = watch(`password`);

  // Handler to prevent numbers in name fields
  const handleNameInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const key = e.key;
    // Allow arrow keys, delete, backspace, tab, etc.
    if (
      key === 'ArrowLeft' ||
      key === 'ArrowRight' ||
      key === 'Backspace' ||
      key === 'Delete' ||
      key === 'Tab' ||
      key === ' ' ||
      key === '-'
    ) {
      return;
    }

    // Block any digit keys
    if (/^\d$/.test(key)) {
      e.preventDefault();
    }

    // block any symbols
    if (/[^a-zA-Z\s]/.test(key)) {
      e.preventDefault();
    }
  };

  const repeatPasswordControl = register('repeatPassword', {
    required: true,
    minLength: {
      value: 8,
      message: 'Please provide a password with at least 8 characters',
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
            userRole === 'student'
              ? 'text-white bg-gradient-to-br from-primary-700 to-primary-800'
              : 'bg-gray-100'
          }`}
          onClick={() => setUserRole('student')}
        >
          Student
        </button>
        <button
          type="button"
          className={`w-1/2 p-2 ${
            userRole === 'tutor'
              ? 'text-white bg-gradient-to-br from-primary-700 to-primary-800'
              : 'bg-gray-100'
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextField>
              <TextField.Label className="mb-1.5 block text-xs sm:text-sm font-medium text-gray-700">
                First Name
                <TextField.Input
                  {...firstNameControl}
                  data-cy={'first-name-input'}
                  required
                  type="text"
                  placeholder={'John'}
                  autoComplete="given-name"
                  className="text-sm sm:text-base"
                  onKeyDown={handleNameInput}
                  pattern="^[^0-9]+$"
                  title="First name cannot contain numbers"
                />
              </TextField.Label>

              <TextField.Error error={errors.firstName?.message} />
            </TextField>

            <TextField>
              <TextField.Label className="mb-1.5 block text-xs sm:text-sm font-medium text-gray-700">
                Last Name
                <TextField.Input
                  {...lastNameControl}
                  data-cy={'last-name-input'}
                  required
                  type="text"
                  placeholder={'Doe'}
                  autoComplete="family-name"
                  className="text-sm sm:text-base"
                  onKeyDown={handleNameInput}
                  pattern="^[^0-9]+$"
                  title="Last name cannot contain numbers"
                />
              </TextField.Label>

              <TextField.Error error={errors.lastName?.message} />
            </TextField>
          </div>

          <TextField>
            <TextField.Label className="mb-1.5 block text-xs sm:text-sm font-medium text-gray-700">
              Email
              <TextField.Input
                {...emailControl}
                data-cy={'email-input'}
                required
                type="email"
                placeholder={'your@email.com'}
                autoComplete="new-email"
                className="text-sm sm:text-base"
              />
            </TextField.Label>

            <TextField.Error error={errors.email?.message} />
          </TextField>

          <TextField>
            <TextField.Label className="mb-1.5 block text-xs sm:text-sm font-medium text-gray-700">
              Password
              <TextField.Input
                {...passwordControl}
                data-cy={'password-input'}
                required
                type="password"
                placeholder={''}
                autoComplete="new-password"
                className="text-sm sm:text-base"
              />
              <TextField.Hint>
                8+ characters that includes lowercase, uppercase, digit, special character
              </TextField.Hint>
              <TextField.Error
                data-cy="password-error"
                error={errors.password?.message}
              />
            </TextField.Label>
          </TextField>

          <TextField>
            <TextField.Label className="mb-1.5 block text-xs sm:text-sm font-medium text-gray-700">
              Repeat Password
              <TextField.Input
                {...repeatPasswordControl}
                data-cy={'repeat-password-input'}
                required
                type="password"
                placeholder={''}
                autoComplete="new-password"
                className="text-sm sm:text-base"
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
              className={
                'w-full btn bg-secondary-600 text-white hover:bg-secondary-500 focus:ring-secondary-500/50 bg-gradient-to-br from-secondary-500 to-secondary-600'
              }
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
