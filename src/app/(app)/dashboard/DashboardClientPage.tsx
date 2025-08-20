'use client';

import AppHeader from '~/app/(app)/components/AppHeader';
import { PageBody } from '~/core/ui/Page';
import { UpcomingSession } from '~/lib/sessions/types/session-v2';
import { Alert, AlertDescription } from '../components/base-v2/ui/Alert';
import { Info } from 'lucide-react';
import StudentDashboard from '../components/student-dashboard/StudentDashboard';
import TutorDBClient from '../components/tutor-dashboard/TutorDashBoardClient';
import AdminDashboardClient from '../components/admin/dashboard/AdminDashboardClient';
import UnauthorizedAccessToast from '../components/UnauthorizedAccessToast';
import { User } from '@supabase/supabase-js';
import { TutorDashboardData } from '~/lib/tutorStats/types/types';

interface DashboardClientPageProps {
  user: User;
  userRole: string;
  sessionData: UpcomingSession[];
  tutorStat: TutorDashboardData | null;
  allUpcomingSessions: UpcomingSession[];
}

const DashboardClientPage: React.FC<DashboardClientPageProps> = ({
  user,
  userRole,
  sessionData,
  tutorStat,
  allUpcomingSessions,
}) => {
  if (userRole === 'tutor') {
    return (
      <>
        <UnauthorizedAccessToast />
        <AppHeader title="Tutor Dashboard" />
        <PageBody>
          {!sessionData.length ? (
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-700">
                You haven&apos;t created any classes yet. Create your first class
                to get started!
              </AlertDescription>
            </Alert>
          ) : (
            <TutorDBClient
              upcomingSessionDataPerWeek={sessionData}
              tutorStat={tutorStat!}
            />
          )}
        </PageBody>
      </>
    );
  } else if (userRole === 'student') {
    return (
      <>
        <UnauthorizedAccessToast />
        <AppHeader title="Student Dashboard" />
        <PageBody>
          {!sessionData.length ? (
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-700">
                You aren&apos;t enrolled in any classes yet. Browse available
                classes to get started!
              </AlertDescription>
            </Alert>
          ) : (
            <StudentDashboard
              upcomingSessionData={sessionData}
              studentId={user.id}
            />
          )}
        </PageBody>
      </>
    );
  } else if (userRole === 'admin') {
    return (
      <>
        <UnauthorizedAccessToast />
        <PageBody>
          {!allUpcomingSessions.length ? (
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-700">
                There are no classes scheduled today
              </AlertDescription>
            </Alert>
          ) : (
            <AdminDashboardClient upcomingSessionData={allUpcomingSessions} />
          )}
        </PageBody>
      </>
    );
  }

  // Handle unknown user role
  return (
    <>
      <AppHeader
        title="Dashboard Error"
        description="We encountered an error while loading your dashboard"
      />
      <PageBody>
        <Alert className="bg-red-50 border-red-200">
          <Info className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            Invalid user role. Please contact support.
          </AlertDescription>
        </Alert>
      </PageBody>
    </>
  );
};

export default DashboardClientPage;
