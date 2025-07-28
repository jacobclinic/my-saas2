// src/app/self-registration/page.tsx
import StudentRegistrationForm from '../../(app)/components/student-registration/RegistrationFormData';
import React from 'react';
import { getNextSessionByClassID } from '~/lib/sessions/database/queries';
import getSupabaseServerComponentClient from '~/core/supabase/server-component-client';
import Logo from '~/core/ui/Logo';
import { Calendar, Clock, Info, User } from 'lucide-react';
import { Card, CardContent } from '~/app/(app)/components/base-v2/ui/Card';
import { ClassRegistrationData } from '~/lib/classes/types/class-v2';

interface SearchParams {
  classId: string;
  className: string;
  nextSession: string;
  time: string;
  tutorName: string;
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const client = getSupabaseServerComponentClient();

  // Extract data from URL parameters
  const classData: ClassRegistrationData = {
    classId: searchParams.classId || '',
    className: searchParams.className || '',
    nextSession: searchParams.nextSession || '',
    time: searchParams.time || '',
    tutorName: searchParams.tutorName || '',
  };

  // Get session data if classId is provided
  let sessionData = null;
  if (classData.classId) {
    sessionData = await getNextSessionByClassID(client, classData.classId);
  }

  // If required data is missing, show error
  if (!classData.classId || !classData.className) {
    return (
      <div className="min-h-screen py-6 sm:py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center bg-gradient-to-br from-primary-800 via-primary-800 to-secondary-600 opacity-90">
        <div className="text-center">
          <Logo />
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 mt-8">
            Invalid Registration Link
          </h2>
          <p className="text-blue-100 text-sm">
            This registration link is invalid or missing required information.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-6 sm:py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center bg-gradient-to-br from-primary-800 via-primary-800 to-secondary-600 opacity-90">
      <div className="text-center mb-8 flex flex-col items-center justify-center space-y-4">
        <Logo />
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
          Register for Classes
        </h2>
        <p className="text-blue-100 text-sm">
          Join Sri Lanka&apos;s premier online tuition platform
        </p>
      </div>
      <div className="w-full max-w-md">
        <Card className="mb-6 rounded-2xl shadow-lg">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {classData.className}
                </h3>
              </div>

              <div className="flex items-center text-gray-600">
                <User className="w-4 h-4 mr-2 flex-shrink-0" />
                {classData.tutorName}
              </div>

              <div className="flex items-center text-gray-600">
                <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                {classData.nextSession}
              </div>

              <div className="flex items-center text-gray-600">
                <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
                {classData.time}
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <div className="flex items-start">
                  <Info className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" />
                  <p className="text-sm text-blue-800">
                    Complete registration to get access to class materials,
                    recordings, and live sessions
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <StudentRegistrationForm
          classData={classData}
          nextSessionData={sessionData!}
        />
      </div>
    </div>
  );
}
