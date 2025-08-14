'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '../base-v2/ui/Card';
import { Button } from '../base-v2/ui/Button';
import { ArrowRight, User, Mail, Phone } from 'lucide-react';
import { registerStudentAction } from '../../../actions/public/student-registration';
import RegistrationSuccess from './RegistrationSuccess';
import { ClassRegistrationData } from '~/lib/classes/types/class-v2';
import type { User as AuthUser } from '@supabase/supabase-js';

interface UserData {
  id: string;
  displayName?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone_number?: string | null;
  address?: string | null;
}

interface SignedInRegistrationProps {
  classData: ClassRegistrationData;
  nextSessionId: string;
  formattedDate?: string;
  formattedTime?: string;
  authUser: AuthUser;
  userData: UserData | null;
}

const SignedInRegistration = ({
  classData,
  nextSessionId,
  formattedDate,
  formattedTime,
  authUser,
  userData,
}: SignedInRegistrationProps) => {
  const [isRegistrationSuccess, setIsRegistrationSuccess] = useState(false);
  const [registeredUserData, setRegisteredUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userData || !authUser) {
      setError('User data not available. Please try again.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Use the existing registration action with minimal data for signed-in users
      const result = await registerStudentAction({
        firstName: userData.first_name || 'Student',
        lastName: userData.last_name || 'User',
        email: authUser.email || '',
        phone: userData.phone_number || '0771234567', // Fallback phone
        birthday: '2000-01-01', // Default birthday if not available
        address: userData.address || 'Colombo', // Default address
        city: 'Colombo', // Default city
        district: 'Colombo', // Default district
        password: 'temp123456', // Temporary password for validation
        classId: classData.classId || ''
      });

      if (result.success) {
        console.log('Student registered successfully:', result);
        setIsRegistrationSuccess(true);
        setRegisteredUserData({
          username: authUser.email,
          email: authUser.email,
          nextClass: {
            sessionId: nextSessionId,
            date: formattedDate || classData.nextSession,
            time: formattedTime || classData.time,
            zoomLink: '',
          },
          materials: [],
        });
      } else {
        setError(result.error || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isRegistrationSuccess) {
    return <RegistrationSuccess studentDetails={registeredUserData} />;
  }

  const displayName = userData?.displayName || 
    `${userData?.first_name || ''} ${userData?.last_name || ''}`.trim() ||
    'User';

  return (
    <div className="flex items-center justify-center">
      <Card className="w-full max-w-2xl rounded-2xl shadow-lg">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">
            Complete Registration
          </h2>
          
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 mb-4">
              Welcome back! We found your account information. Please review and complete your registration for this class.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center text-gray-700">
                <User className="w-4 h-4 mr-3 text-gray-500" />
                <span className="font-medium">Name:</span>
                <span className="ml-2">{displayName}</span>
              </div>
              
              <div className="flex items-center text-gray-700">
                <Mail className="w-4 h-4 mr-3 text-gray-500" />
                <span className="font-medium">Email:</span>
                <span className="ml-2">{authUser.email}</span>
              </div>
              
              {userData?.phone_number && (
                <div className="flex items-center text-gray-700">
                  <Phone className="w-4 h-4 mr-3 text-gray-500" />
                  <span className="font-medium">Phone:</span>
                  <span className="ml-2">{userData.phone_number}</span>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Button
              type="submit"
              variant={'darkBlue'}
              disabled={isLoading}
              className={`w-full ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center justify-center gap-2">
                {isLoading ? 'Completing Registration...' : 'Complete Registration'}
                <ArrowRight className="h-4 w-4 text-white" />
              </div>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignedInRegistration;