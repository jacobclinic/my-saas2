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

// import { registerStudentAction } from '@/app/actions/registerStudentAction';

interface RegistrationFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  password: string;
}

interface StudentRegistrationFormrops {
  classData: ClassRegistrationData;
  nextSessionData: UpcomingSession;
}

const StudentRegistrationForm = ({
  classData,
  nextSessionData
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
  const [ isRegisterViaLogin, setIsRegisterViaLogin ] = useState(false);

  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const signUpMutation = useSignUpWithEmailAndPasswordMutation();

  const validateForm = () => {
    const newErrors: Partial<RegistrationFormData> = {};
    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.phone) newErrors.phone = 'Phone number is required';
    if (!formData.password) newErrors.password = 'Password is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
    return <StudentRegistrationViaLogin classData={classData} nextSessionData={nextSessionData} setIsRegisterViaLogin={setIsRegisterViaLogin}/>
  }

  if (isRegistrationSuccess) {
    return <RegistrationSuccess studentDetails={registeredUserData} />;
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setFormData({ ...formData, password: newPassword });

    // Clear error when password changes
    if (passwordError) {
      setPasswordError('');
    }

    // Revalidate confirmation if it exists
    if (confirmPassword && newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
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
    }
  };

  return (
    <div className="flex items-center justify-center">
      <Card className="w-full max-w-2xl rounded-2xl shadow-lg">
        <CardContent className='p-6'>
          <h2 className='text-2xl font-bold mb-6 text-gray-900'>Create Your Account</h2>
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Personal Information */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">First Name</label>
                <Input
                  placeholder="Enter first name"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
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
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  icon={<User className="h-4 w-4 text-gray-500" />}
                />
                {errors.lastName && (
                  <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  placeholder="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  icon={<Mail className="h-4 w-4 text-gray-500" />}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Address</label>
                <Input
                  placeholder="Enter address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  icon={<User className="h-4 w-4 text-gray-500" />}
                />
                {errors.address && (
                  <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Phone Number</label>
                <Input
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  icon={<Phone className="h-4 w-4 text-gray-500" />}
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
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
              variant={"darkBlue"}>
              <div className="flex items-center justify-center gap-2">
                Complete Registration
                {/* lets add right arrow icon */}
                <ArrowRight className="h-4 w-4 text-white" />
              </div>
            </Button>
            {/* Button to login if already have an account, set isRegisterViaLogin true when clicked */}
            <p className="text-sm text-gray-600 mt-4 text-center">
               Already have an account? <a onClick={() => setIsRegisterViaLogin(true)} className="text-blue-600 font-medium hover:underline transition-all cursor-pointer">Log in</a>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentRegistrationForm;
