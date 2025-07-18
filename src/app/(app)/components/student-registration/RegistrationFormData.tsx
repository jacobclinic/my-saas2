'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../base-v2/ui/Card';
import { Input } from '../base-v2/ui/Input';
import { Button } from '../base-v2/ui/Button';
import { User, Mail, Phone, ArrowRight, Lock } from 'lucide-react';
import { registerStudentAction } from '../../../actions/public/student-registration';
import { ClassRegistrationData } from '~/lib/registration-link';
import RegistrationSuccess from './RegistrationSuccess';
import useSignUpWithEmailAndPasswordMutation from '~/core/hooks/use-sign-up-with-email-password';
import StudentRegistrationViaLogin from './RegisterViaLogin';
import { UpcomingSession } from '~/lib/sessions/types/session-v2';
import { validatePassword } from '~/core/hooks/use-validate-password';
import { validateName } from '~/core/hooks/use-validate-name';
import { validatePhoneNumber } from '~/core/hooks/use-validate-phonenumber';
import { validateEmail } from '~/core/hooks/use-validate-email';
import { filterNameInput, filterPhoneInput } from '~/core/utils/input-filters';

// import { registerStudentAction } from '@/app/actions/registerStudentAction';

interface RegistrationFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  password: string;
}

interface FieldTouchedState {
  firstName?: boolean;
  lastName?: boolean;
  email?: boolean;
  phone?: boolean;
  address?: boolean;
  password?: boolean;
}

interface StudentRegistrationFormrops {
  classData: ClassRegistrationData;
  nextSessionData: UpcomingSession;
}

const StudentRegistrationForm = ({
  classData,
  nextSessionData,
}: StudentRegistrationFormrops) => {
  const [formData, setFormData] = useState<RegistrationFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    password: '',
  });
  const [errors, setErrors] = useState<Partial<RegistrationFormData>>({});
  const [isRegistrationSuccess, setIsRegistrationSuccess] = useState(false);
  const [registeredUserData, setRegisteredUserData] = useState<any>(null);
  const [isRegisterViaLogin, setIsRegisterViaLogin] = useState(false);
  const [fieldTouched, setFieldTouched] = useState<FieldTouchedState>({});

  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const signUpMutation = useSignUpWithEmailAndPasswordMutation();

  // Real-time validation function
  const validateField = (
    fieldName: keyof RegistrationFormData,
    value: string,
  ) => {
    const newErrors = { ...errors };

    switch (fieldName) {
      case 'firstName':
      case 'lastName':
        const nameResult = validateName(value);
        if (!nameResult.isValid) {
          newErrors[fieldName] = nameResult.message;
        } else {
          delete newErrors[fieldName];
        }
        break;

      case 'email':
        const emailResult = validateEmail(value);
        if (!emailResult.isValid) {
          newErrors.email = emailResult.message;
        } else {
          delete newErrors.email;
        }
        break;

      case 'phone':
        const phoneResult = validatePhoneNumber(value);
        if (!phoneResult.isValid) {
          newErrors.phone = phoneResult.message;
        } else {
          delete newErrors.phone;
        }
        break;

      case 'password':
        const passwordResult = validatePassword(value);
        if (!passwordResult.isValid) {
          newErrors.password = passwordResult.message;
        } else {
          delete newErrors.password;
        }
        break;

      case 'address':
        if (!value.trim()) {
          newErrors.address = 'Address is required';
        } else {
          delete newErrors.address;
        }
        break;
    }

    setErrors(newErrors);
  };

  // Handle field changes with validation
  const handleFieldChange = (
    fieldName: keyof RegistrationFormData,
    value: string,
  ) => {
    // Apply input restrictions using utility functions
    let filteredValue = value;

    if (fieldName === 'firstName' || fieldName === 'lastName') {
      filteredValue = filterNameInput(value);
    } else if (fieldName === 'phone') {
      filteredValue = filterPhoneInput(value);
    }

    setFormData({ ...formData, [fieldName]: filteredValue });

    // Mark field as touched
    setFieldTouched({ ...fieldTouched, [fieldName]: true });

    // Validate field if it has been touched
    if (fieldTouched[fieldName] || filteredValue.length > 0) {
      validateField(fieldName, filteredValue);
    }
  };

  const validateForm = () => {
    const newErrors: Partial<RegistrationFormData> = {};

    // Validate first name
    const firstNameResult = validateName(formData.firstName);
    if (!firstNameResult.isValid) {
      newErrors.firstName = firstNameResult.message;
    }

    // Validate last name
    const lastNameResult = validateName(formData.lastName);
    if (!lastNameResult.isValid) {
      newErrors.lastName = lastNameResult.message;
    }

    // Validate email
    const emailResult = validateEmail(formData.email);
    if (!emailResult.isValid) {
      newErrors.email = emailResult.message;
    }

    // Validate phone number
    const phoneResult = validatePhoneNumber(formData.phone);
    if (!phoneResult.isValid) {
      newErrors.phone = phoneResult.message;
    }

    // Validate password
    const passwordResult = validatePassword(formData.password);
    if (!passwordResult.isValid) {
      newErrors.password = passwordResult.message;
    }

    // Validate address
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    // Check password confirmation
    if (formData.password !== confirmPassword) {
      setPasswordError('Passwords do not match');
    } else {
      setPasswordError('');
    }

    setErrors(newErrors);
    return (
      Object.keys(newErrors).length === 0 &&
      !passwordError &&
      confirmPassword.trim() !== ''
    );
  };

  // Check if form is valid for enabling/disabling the submit button
  const isFormValid = () => {
    // Use validation functions
    const isFirstNameValid = validateName(formData.firstName).isValid;
    const isLastNameValid = validateName(formData.lastName).isValid;
    const isEmailValid = validateEmail(formData.email).isValid;
    const isPhoneValid = validatePhoneNumber(formData.phone).isValid;
    const isPasswordValid = validatePassword(formData.password).isValid;

    const isBasicInfoValid =
      isFirstNameValid &&
      isLastNameValid &&
      isEmailValid &&
      isPhoneValid &&
      formData.address.trim() !== '' &&
      isPasswordValid;

    const isPasswordConfirmationValid =
      confirmPassword.trim() !== '' &&
      formData.password === confirmPassword &&
      !passwordError;

    return isBasicInfoValid && isPasswordConfirmationValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      if (validateForm()) {
        try {
          // Check if the user already exists in the database
          const registerResult = await signUpMutation.trigger({
            email: formData.email,
            password: formData.password,
            userRole: 'student',
          });

          if (!registerResult) {
            throw new Error('User already exists');
          }
          console.log('User registered successfully:', registerResult);
        } catch (error) {
          setErrors({ email: 'User already exists' });
          return;
        }

        const result = await registerStudentAction({
          ...formData,
          classId: classData.classId || '',
          nameOfClass: classData.className,
        });

        if (result.success) {
          console.log('Student registered successfully:', result);
          // Redirect to credentials/welcome page
          setIsRegistrationSuccess(true);
          setRegisteredUserData({
            username: result.userData?.email,
            email: result.userData?.email,
            nextClass: {
              sessionId: nextSessionData.id,
              date: classData.nextSession,
              time: classData.time,
              zoomLink: '',
            },
            materials: [],
          });
        } else {
          setErrors({ email: result.error });
        }
      }
    }
  };

  if (isRegisterViaLogin) {
    return (
      <StudentRegistrationViaLogin
        classData={classData}
        nextSessionData={nextSessionData}
        setIsRegisterViaLogin={setIsRegisterViaLogin}
      />
    );
  }

  if (isRegistrationSuccess) {
    return <RegistrationSuccess studentDetails={registeredUserData} />;
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setFormData({ ...formData, password: newPassword });

    // Mark password field as touched
    setFieldTouched({ ...fieldTouched, password: true });

    // Validate password field
    validateField('password', newPassword);

    // Clear password error when password changes
    if (passwordError) {
      setPasswordError('');
    }

    // Revalidate confirmation if it exists
    if (confirmPassword && newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
    } else if (confirmPassword && newPassword === confirmPassword) {
      setPasswordError('');
    }
  };

  const handleConfirmPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const newConfirmPassword = e.target.value;
    setConfirmPassword(newConfirmPassword);

    // Validate only if both fields have values
    if (formData.password && newConfirmPassword) {
      setPasswordError(
        formData.password !== newConfirmPassword
          ? 'Passwords do not match'
          : '',
      );
    } else if (!newConfirmPassword && formData.password) {
      setPasswordError('Please confirm your password');
    }
  };

  return (
    <div className="flex items-center justify-center">
      <Card className="w-full max-w-2xl rounded-2xl shadow-lg">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">
            Create Your Account
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">First Name</label>
                  <Input
                    placeholder="Enter first name"
                    value={formData.firstName}
                    onChange={(e) =>
                      handleFieldChange('firstName', e.target.value)
                    }
                    onBlur={() => {
                      setFieldTouched({ ...fieldTouched, firstName: true });
                      validateField('firstName', formData.firstName);
                    }}
                    icon={<User className="h-4 w-4 text-gray-500" />}
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.firstName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium">Last Name</label>
                  <Input
                    placeholder="Enter last name"
                    value={formData.lastName}
                    onChange={(e) =>
                      handleFieldChange('lastName', e.target.value)
                    }
                    onBlur={() => {
                      setFieldTouched({ ...fieldTouched, lastName: true });
                      validateField('lastName', formData.lastName);
                    }}
                    icon={<User className="h-4 w-4 text-gray-500" />}
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  placeholder="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  onBlur={() => {
                    setFieldTouched({ ...fieldTouched, email: true });
                    validateField('email', formData.email);
                  }}
                  icon={<Mail className="h-4 w-4 text-gray-500" />}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Phone Number</label>
                <Input
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                  onBlur={() => {
                    setFieldTouched({ ...fieldTouched, phone: true });
                    validateField('phone', formData.phone);
                  }}
                  icon={<Phone className="h-4 w-4 text-gray-500" />}
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Address</label>
                <textarea
                  placeholder="123 main street, city, Province, Postal code"
                  value={formData.address}
                  onChange={(e) => handleFieldChange('address', e.target.value)}
                  onBlur={() => {
                    setFieldTouched({ ...fieldTouched, address: true });
                    validateField('address', formData.address);
                  }}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
                {errors.address && (
                  <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Password</label>
                <Input
                  placeholder="Enter a password"
                  value={formData.password}
                  onChange={handlePasswordChange}
                  type="password"
                  icon={<Lock className="h-4 w-4 text-gray-500" />}
                />
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                )}
                {!errors.password && (
                  <p className="text-gray-500 text-xs mt-1">
                    Password must contain at least 8 characters, including
                    uppercase, lowercase, and digit
                  </p>
                )}

                <label className="text-sm font-medium mt-4 block">
                  Password confirmation
                </label>
                <Input
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  type="password"
                  icon={<Lock className="h-4 w-4 text-gray-500" />}
                />
                {passwordError && (
                  <p className="text-red-500 text-sm mt-1">{passwordError}</p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              variant={'darkBlue'}
              disabled={!isFormValid() || signUpMutation.isMutating}
              className={`${!isFormValid() ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center justify-center gap-2">
                {signUpMutation.isMutating
                  ? 'Registering...'
                  : 'Complete Registration'}
                {/* lets add right arrow icon */}
                <ArrowRight className="h-4 w-4 text-white" />
              </div>
            </Button>
            {/* Button to login if already have an account, set isRegisterViaLogin true when clicked */}
            <p className="text-sm text-gray-600 mt-4 text-center">
              Already have an account?{' '}
              <a
                onClick={() => setIsRegisterViaLogin(true)}
                className="text-blue-600 font-medium hover:underline transition-all cursor-pointer"
              >
                Log in
              </a>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentRegistrationForm;
