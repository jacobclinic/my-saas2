'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../base-v2/ui/Card';
import { Input } from '../base-v2/ui/Input';
import { Button } from '../base-v2/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../base-v2/ui/Select';
import { Checkbox } from '../base-v2/ui/Checkbox';
import { User, Mail, Phone, ArrowRight, Lock, Calendar, MapPin } from 'lucide-react';
import { registerStudentAction } from '../../../actions/public/student-registration';
import RegistrationSuccess from './RegistrationSuccess';
import useSignUpWithEmailAndPasswordMutation from '~/core/hooks/use-sign-up-with-email-password';
import StudentRegistrationViaLogin from './RegisterViaLogin';
import { UpcomingSession } from '~/lib/sessions/types/session-v2';
import { filterNameInput, filterPhoneInput } from '~/core/utils/input-filters';
import { SRI_LANKA_DISTRICTS } from '~/lib/constants/sri-lanka-districts';
import { validatePassword } from '~/core/utils/validate-password';
import { getBirthdayDateLimits, validateBirthday } from '~/core/utils/validate-birthday';
import { validateEmail } from '../../../../core/utils/validate-email';
import { validatePhoneNumber } from '~/core/utils/validate-phonenumber';
import { validateName } from '~/core/utils/validate-name';
import { ClassRegistrationData } from '~/lib/classes/types/class-v2';
import SignedInRegistration from './SignedInRegistration';
import type { User as AuthUser } from '@supabase/supabase-js';
import type BaseUserData from '~/core/session/types/user-data';

// import { registerStudentAction } from '@/app/actions/registerStudentAction';

interface RegistrationFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthday: string;
  address: string;
  city: string;
  district: string;
  password: string;
}

interface FieldTouchedState {
  firstName?: boolean;
  lastName?: boolean;
  email?: boolean;
  phone?: boolean;
  birthday?: boolean;
  address?: boolean;
  city?: boolean;
  district?: boolean;
  password?: boolean;
}

interface StudentRegistrationFormProps {
  classData: ClassRegistrationData;
  nextSessionId: string;
  formattedDate?: string;
  formattedTime?: string;
  authUser?: AuthUser | null;
  userData?: BaseUserData | null;
} 

const StudentRegistrationForm = ({
  classData,
  nextSessionId,
  formattedDate,
  formattedTime,
  authUser,
  userData,
}: StudentRegistrationFormProps) => {
  // All hooks must be called before any conditional logic
  const [formData, setFormData] = useState<RegistrationFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthday: '',
    address: '',
    city: '',
    district: '',
    password: '',
  });
  const [errors, setErrors] = useState<Partial<RegistrationFormData>>({});
  const [isRegistrationSuccess, setIsRegistrationSuccess] = useState(false);
  const [registeredUserData, setRegisteredUserData] = useState<any>(null);
  const [isRegisterViaLogin, setIsRegisterViaLogin] = useState(false);
  const [fieldTouched, setFieldTouched] = useState<FieldTouchedState>({});

  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const signUpMutation = useSignUpWithEmailAndPasswordMutation();
  const birthdayLimits = getBirthdayDateLimits();

  // If user is signed in, show simplified registration form
  if (authUser && userData) {
    // Extend userData with additional fields for student registration
    // These fields might not be available in the base user data
    const studentUserData = {
      ...userData,
      city: (userData as any).city || null,
      district: (userData as any).district || null,
      birthday: (userData as any).birthday || null,
    };

    return (
      <SignedInRegistration
        classData={classData}
        nextSessionId={nextSessionId}
        formattedDate={formattedDate}
        formattedTime={formattedTime}
        authUser={authUser}
        userData={studentUserData}
      />
    );
  }

  // Simplified validation function
  const validateFormField = (fieldName: keyof RegistrationFormData, value: string) => {
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

      case 'birthday':
        const birthdayResult = validateBirthday(value);
        if (!birthdayResult.isValid) {
          newErrors.birthday = birthdayResult.message;
        } else {
          delete newErrors.birthday;
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

      case 'city':
        if (!value.trim()) {
          newErrors.city = 'City is required';
        } else {
          delete newErrors.city;
        }
        break;

      case 'district':
        if (!value.trim()) {
          newErrors.district = 'District is required';
        } else {
          delete newErrors.district;
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
      validateFormField(fieldName, filteredValue);
    }
  };

  // Check if form is valid for enabling/disabling the submit button
  const isFormValid = () => {
    // Use validation functions
    const isFirstNameValid = validateName(formData.firstName).isValid;
    const isLastNameValid = validateName(formData.lastName).isValid;
    const isEmailValid = validateEmail(formData.email).isValid;
    const isPhoneValid = validatePhoneNumber(formData.phone).isValid;
    const isBirthdayValid = validateBirthday(formData.birthday).isValid;
    const isPasswordValid = validatePassword(formData.password).isValid;

    const isBasicInfoValid =
      isFirstNameValid &&
      isLastNameValid &&
      isEmailValid &&
      isPhoneValid &&
      isBirthdayValid &&
      formData.address.trim() !== '' &&
      formData.city.trim() !== '' &&
      formData.district.trim() !== '' &&
      isPasswordValid;

    const isPasswordConfirmationValid =
      confirmPassword.trim() !== '' &&
      formData.password === confirmPassword &&
      !passwordError;

    return isBasicInfoValid && isPasswordConfirmationValid && agreeToTerms;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      return;
    }

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
      classId: classData.classId || ''
    });

    if (result.success) {
      console.log('Student registered successfully:', result);
      // Redirect to credentials/welcome page
      setIsRegistrationSuccess(true);
      setRegisteredUserData({
        username: result.userData?.email,
        email: result.userData?.email,
        nextClass: {
          sessionId: nextSessionId,
          date: formattedDate || classData.nextSession,
          time: formattedTime || classData.time,
          zoomLink: '',
        },
        materials: [],
      });
    } else {
      setErrors({ email: result.error });
    }
  };

  if (isRegisterViaLogin) {
    return (
      <StudentRegistrationViaLogin
        classData={classData}
        nextSessionId={nextSessionId}
        setIsRegisterViaLogin={setIsRegisterViaLogin}
        formattedDate={formattedDate}
        formattedTime={formattedTime}
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
    validateFormField('password', newPassword);

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
                      validateFormField('firstName', formData.firstName);
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
                      validateFormField('lastName', formData.lastName);
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
                    validateFormField('email', formData.email);
                  }}
                  icon={<Mail className="h-4 w-4 text-gray-500" />}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Phone Number</label>
                  <Input
                    placeholder="07XXXXXXXX"
                    value={formData.phone}
                    onChange={(e) => handleFieldChange('phone', e.target.value)}
                    onBlur={() => {
                      setFieldTouched({ ...fieldTouched, phone: true });
                      validateFormField('phone', formData.phone);
                    }}
                    icon={<Phone className="h-4 w-4 text-gray-500" />}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium">Birthday</label>
                  <Input
                    type="date"
                    value={formData.birthday}
                    min={birthdayLimits.min}
                    max={birthdayLimits.max}
                    onChange={(e) => handleFieldChange('birthday', e.target.value)}
                    onBlur={() => {
                      setFieldTouched({ ...fieldTouched, birthday: true });
                      validateFormField('birthday', formData.birthday);
                    }}
                    icon={<Calendar className="h-4 w-4 text-gray-500" />}
                  />
                  {errors.birthday && (
                    <p className="text-red-500 text-sm mt-1">{errors.birthday}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Address</label>
                <Input
                  placeholder="123 main street"
                  value={formData.address}
                  onChange={(e) => handleFieldChange('address', e.target.value)}
                  onBlur={() => {
                    setFieldTouched({ ...fieldTouched, address: true });
                    validateFormField('address', formData.address);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
                {errors.address && (
                  <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">City</label>
                  <Input
                    placeholder="Enter city"
                    value={formData.city}
                    onChange={(e) => handleFieldChange('city', e.target.value)}
                    onBlur={() => {
                      setFieldTouched({ ...fieldTouched, city: true });
                      validateFormField('city', formData.city);
                    }}
                    icon={<MapPin className="h-4 w-4 text-gray-500" />}
                  />
                  {errors.city && (
                    <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium">District</label>
                  <Select
                    value={formData.district}
                    onValueChange={(value) => handleFieldChange('district', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select district" />
                    </SelectTrigger>
                    <SelectContent>
                      {SRI_LANKA_DISTRICTS.map((district) => (
                        <SelectItem key={district} value={district}>
                          {district}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.district && (
                    <p className="text-red-500 text-sm mt-1">{errors.district}</p>
                  )}
                </div>
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

            {/* Terms and Conditions */}
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="terms"
                checked={agreeToTerms}
                onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
              />
              <label 
                htmlFor="terms" 
                className="text-sm text-gray-600 cursor-pointer"
              >
                I agree to the{' '}
                <a 
                  href="/terms" 
                  target="_blank" 
                  className="text-blue-600 hover:underline"
                >
                  Terms of Service
                </a>
                {' '}and{' '}
                <a 
                  href="/privacy" 
                  target="_blank" 
                  className="text-blue-600 hover:underline"
                >
                  Privacy Policy
                </a>
              </label>
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
