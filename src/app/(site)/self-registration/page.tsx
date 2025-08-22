import StudentRegistrationForm from '../../(app)/components/student-registration/RegistrationFormData';
import React from 'react';
import getSupabaseServerComponentClient from '~/core/supabase/server-component-client';
import Logo from '~/core/ui/Logo';
import { Calendar, Clock, Info, User } from 'lucide-react';
import { Card, CardContent } from '~/app/(app)/components/base-v2/ui/Card';
import { ClassRegistrationData } from '~/lib/classes/types/class-v2';
import { PublicNextSessionResponse } from '~/lib/sessions/types/session-v2';
import { formatToHumanReadableDate, formatToLocalHHmmAMPM } from '~/lib/utils/date-utils';
import { getUserDataById } from '~/lib/user/database/queries';
import { formatToLocalTime } from '~/lib/utils/timezone-utils';

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

  // Check if user is authenticated and get their data
  const { data: { user: authUser } } = await client.auth.getUser();
  let userData = null;
  
  if (authUser) {
    userData = await getUserDataById(client, authUser.id);
  }

  // Extract data from URL parameters
  const classData: ClassRegistrationData = {
    classId: searchParams.classId || '',
    className: searchParams.className || '',
    nextSession: searchParams.nextSession || '',
    time: searchParams.time || '',
    tutorName: searchParams.tutorName || '',
  };

  // Get session data if classId is provided via public API route
  let classRegistrationData = null;
  if (searchParams.classId) {
    const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const url = `${origin}/api/public/sessions/next?classId=${encodeURIComponent(searchParams.classId)}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (res.ok) {
      const json = await (await res.json()) as PublicNextSessionResponse;
      classRegistrationData = json.success ? json.data : null;
    }
  }

  if (!searchParams.classId) {
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
                  {classRegistrationData?.class.name}
                </h3>
              </div>

              <div className="flex items-center text-gray-600">
                <User className="w-4 h-4 mr-2 flex-shrink-0" />
                {classRegistrationData?.class.tutor?.first_name} {classRegistrationData?.class.tutor?.last_name}
              </div>

              <div className="flex items-center text-gray-600">
                <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                {formatToHumanReadableDate(classRegistrationData?.start_time!)}
              </div>

              <div className="flex items-center text-gray-600">
                <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
                {formatToLocalTime(classRegistrationData?.start_time!, 'h:mm a') + ' - ' + formatToLocalTime(classRegistrationData?.end_time!, 'h:mm a')}
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
          nextSessionId={classRegistrationData?.id!}
          formattedDate={classRegistrationData ? formatToHumanReadableDate(classRegistrationData.start_time!) : undefined}
          formattedTime={classRegistrationData ? formatToLocalTime(classRegistrationData.start_time!, 'h:mm a') + ' - ' + formatToLocalTime(classRegistrationData.end_time!, 'h:mm a') : undefined}
          authUser={authUser}
          userData={userData}
        />
      </div>
    </div>
  );
}
