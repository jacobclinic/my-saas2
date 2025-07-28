import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../base-v2/ui/Card';
import { Input } from '../base-v2/ui/Input';
import { Button } from '../base-v2/ui/Button';
import { User, Mail, Phone, ArrowRight, Lock } from 'lucide-react';
import RegistrationSuccess from './RegistrationSuccess';
import { registerStudentViaLoginAction } from '~/app/actions/public/student-class-register';
import { UpcomingSession } from '~/lib/sessions/types/session-v2';
import { ClassRegistrationData } from '~/lib/classes/types/class-v2';

// import { registerStudentAction } from '@/app/actions/registerStudentAction';

interface RegistrationViaLoginFormData {
  email: string;
  password: string;
}

interface StudentRegistrationFormProps {
  classData: ClassRegistrationData;
  nextSessionData: UpcomingSession;
  setIsRegisterViaLogin: (isRegisterViaLogin: boolean) => void;
}

const StudentRegistrationViaLogin = ({
  classData,
  nextSessionData,
  setIsRegisterViaLogin
}: StudentRegistrationFormProps) => {
  const [formData, setFormData] = useState<RegistrationViaLoginFormData>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Partial<RegistrationViaLoginFormData>>(
    {},
  );
  const [isRegistrationSuccess, setIsRegistrationSuccess] = useState(false);
  const [registeredUserData, setRegisteredUserData] = useState<any>(null);

  const validateForm = () => {
    const newErrors: Partial<RegistrationViaLoginFormData> = {};
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        const result = await registerStudentViaLoginAction({
          ...formData,
          classId: classData.classId || '',
          className: classData.className || '',
        });

        if (result.success) {
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
      } catch (error) {
        console.error('Error during registration:', error);
        setErrors({ email: 'An error occurred during registration' });
      }
    }
  };

  if (isRegistrationSuccess) {
    return <RegistrationSuccess studentDetails={registeredUserData} />;
  }

  return (
    <div className="flex items-center justify-center">
      <Card className="w-full max-w-2xl rounded-2xl shadow-lg">
        <CardContent className='p-6'>
          <h2 className='text-2xl font-bold mb-6 text-gray-900'>Log in to your account</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
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
                <label className="text-sm font-medium">Password</label>
                <Input
                  placeholder="Enter a password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  type="password"
                  icon={<Lock className="h-4 w-4 text-gray-500" />}
                />
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password}</p>
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
          </form>
          <p className="text-sm text-gray-600 mt-4 text-center">
            Don&apos;t have an account? <a onClick={() => setIsRegisterViaLogin(false)} className="text-blue-600 font-medium hover:underline transition-all cursor-pointer">Sign up</a>
          </p>

        </CardContent>
      </Card>
    </div>
  );
};

export default StudentRegistrationViaLogin;
