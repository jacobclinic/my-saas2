import { useForm } from 'react-hook-form';
import { useEffect } from 'react';

import TextField from '~/core/ui/TextField';
import Button from '~/core/ui/Button';
import If from '~/core/ui/If';
import { filterNameInput } from '~/core/utils/input-filters';
import { validatePassword } from '~/core/utils/validate-password';
import { validateEmailForForm } from '../../../core/utils/validate-email';
import { validateNameForForm } from '~/core/utils/validate-name';
import { USER_ROLES } from '~/lib/constants';


const EmailPasswordSignUpForm: React.FCC<{
  onSubmit: (params: {
    email: string;
    password: string;
    repeatPassword: string;
    firstName: string;
    lastName: string;
    userRole: string;
    phoneNumber: string;
    address: string;
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
      phoneNumber: '',
      address: '',
    },
    mode: 'onChange',
  });
  // Address validation: more than 3 characters
  const addressControl = register('address', {
    required: 'Address is required',
    minLength: {
      value: 4,
      message: 'Address must be more than 3 characters',
    },
  });
  
  const userRole = USER_ROLES.TUTOR;
  const emailControl = register('email', {
    required: true,
    validate: validateEmailForForm,
  });
  const firstNameControl = register('firstName', {
    required: true,
    validate: validateNameForForm,
    onChange: (e) => {
      // Filter input to allow only letters and spaces
      const filtered = filterNameInput(e.target.value);
      e.target.value = filtered;
    },
  });
  
  const lastNameControl = register('lastName', {
    required: true,
    validate: validateNameForForm,
    onChange: (e) => {
      // Filter input to allow only letters and spaces
      const filtered = filterNameInput(e.target.value);
      e.target.value = filtered;
    },
  });
  
  const errors = formState.errors;
  // Phone number validation: starts with 0, length 10 digits
  const phoneNumberControl = register('phoneNumber', {
    required: 'Phone number is required',
    pattern: {
      value: /^0\d{9}$/,
      message: 'Phone number must start with 0 and be 10 digits',
    },
  });

  // Prevent non-digit input for phone number
  const handlePhoneInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const key = e.key;
    // Allow control keys
    if (
      key === 'ArrowLeft' ||
      key === 'ArrowRight' ||
      key === 'Backspace' ||
      key === 'Delete' ||
      key === 'Tab'
    ) {
      return;
    }
    // Block non-digit keys
    if (!/\d/.test(key)) {
      e.preventDefault();
    }
  };

  // Check if all required fields are filled and no errors
  const requiredFields: (keyof typeof values)[] = [
    'email',
    'password',
    'repeatPassword',
    'firstName',
    'lastName',
    'phoneNumber',
    'address',
  ];
  const values = watch();
  const allFilled = requiredFields.every(
    (field) => values[field] && values[field].toString().trim().length > 0,
  );
  const hasErrors = Object.keys(errors).length > 0;
  const isFormValid = allFilled && !hasErrors;

  // Re-validate password when user role changes
  useEffect(() => {
    trigger('password');
    trigger('repeatPassword');
  }, [userRole, trigger]);

  const passwordControl = register('password', {
    required: true,
    validate: (value) => {
      const result = validatePassword(value);
      if (!result.isValid) {
        return result.message;
      }
      return true;
    },
  });

  const passwordValue = watch(`password`);

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

          {/* Phone number */}
          <TextField>
            <TextField.Label className="mb-1.5 block text-xs sm:text-sm font-medium text-gray-700">
              Phone Number
              <TextField.Input
                {...phoneNumberControl}
                data-cy={'phone-number-input'}
                required
                type="tel"
                placeholder={'07XXXXXXXX'}
                autoComplete="tel"
                className="text-sm sm:text-base"
                maxLength={10}
                pattern="^0\d{9}$"
                title="Phone number must start with 0 and be 10 digits"
                onKeyDown={handlePhoneInput}
              />
            </TextField.Label>
            <TextField.Error error={errors.phoneNumber?.message} />
          </TextField>

          {/* Address input field below phone and dob */}
          <TextField>
            <TextField.Label className="mb-1.5 block text-xs sm:text-sm font-medium text-gray-700">
              Address
              <TextField.Input
                {...addressControl}
                data-cy={'address-input'}
                required
                type="text"
                placeholder={'Enter your address'}
                autoComplete="street-address"
                className="text-sm sm:text-base"
              />
            </TextField.Label>
            <TextField.Error error={errors.address?.message} />
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
                8+ characters that includes lowercase, uppercase, digit
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
              disabled={!isFormValid || loading}
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
