import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../base-v2/ui/Card';
import { Input } from '../base-v2/ui/Input';
import { Button } from '../base-v2/ui/Button';
import { User, Mail, Phone, ArrowRight, Lock } from 'lucide-react';
import { ClassRegistrationData } from '~/lib/registration-link';
import RegistrationSuccess from './RegistrationSuccess';
import { registerStudentViaLoginAction } from '~/app/actions/public/student-class-register';

// import { registerStudentAction } from '@/app/actions/registerStudentAction';

interface RegistrationViaLoginFormData {
  email: string;
  password: string;
}

interface StudentRegistrationFormrops {
  classData: ClassRegistrationData;
}

const StudentRegistrationViaLogin = ({
  classData,
}: StudentRegistrationFormrops) => {
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-blue-600">
            Join Your Class
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Class Info */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h2 className="font-semibold text-lg mb-2">
                {classData.className}
              </h2>
              <p className="text-blue-600">
                Next class : {classData.nextSession}
              </p>
              <p className="text-blue-600">Class time: {classData.time}</p>
            </div>

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

            <Button type="submit" className="w-full">
              <div className="flex items-center justify-center gap-2">
                Complete Registration
                {/* lets add right arrow icon */}
                <ArrowRight className="h-4 w-4 text-white" />
              </div>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentRegistrationViaLogin;
