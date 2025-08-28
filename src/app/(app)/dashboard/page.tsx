import { redirect } from 'next/navigation';
import AppHeader from '~/app/(app)/components/AppHeader';
import { PageBody } from '~/core/ui/Page';
import getSupabaseServerComponentClient from '~/core/supabase/server-component-client';
import {
  getAllUpcommingSessionsByTutorIdData,
  getAllUpcomingSessionsByStudentIdPerWeek,
  getTodaysAllUpcommingSessionsData,
} from '~/lib/sessions/database/queries';
import { Alert, AlertDescription } from '../components/base-v2/ui/Alert';
import { Info } from 'lucide-react';
import StudentDashboard from '../components/student-dashboard/StudentDashboard';
import TutorDBClient from '../components/tutor-dashboard/TutorDashBoardClient';
import AdminDashboardClient from '../components/admin/dashboard/AdminDashboardClient';
import UnauthorizedAccessToast from '../components/UnauthorizedAccessToast';
import TimezoneGreeting from '../components/TimezoneGreeting';
import { getTutorDashboardDataAction } from '~/lib/tutorStats/server-action';

export const metadata = {
  title: 'Dashboard',
};


async function DashboardPage() {
  const client = getSupabaseServerComponentClient();

  try {
    // Get user and handle authentication
    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser();

    // Handle authentication error
    if (authError || !user) {
      redirect('/auth/sign-in');
    }

    // Get user role and name
    const { data: userData, error: userError } = await client
      .from('users')
      .select('user_role, first_name, last_name')
      .eq('id', user.id)
      .single();

    if (userError) {
      throw userError;
    }

    const userRole = userData?.user_role || 'admin';
    // const userRole = userData?.user_role || "student";

    // Fetch appropriate data based on user role
    if (userRole === 'tutor') {
      const [sessionData] = await Promise.all([
        getAllUpcommingSessionsByTutorIdData(client, user.id, true),
      ]);

      const { tutorStat, error } = await getTutorDashboardDataAction(user.id);
      if (error) {
        console.error('Error fetching tutor dashboard data:', error);
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
                  Unable to load tutor dashboard data. Please try refreshing the
                  page or contact support if the problem persists.
                </AlertDescription>
              </Alert>
            </PageBody>
          </>
        );
      }

      // Generate dynamic greeting for tutor
      const tutorName = userData.first_name ? `${userData.first_name}` : 'Tutor';
      const dynamicTitle = <TimezoneGreeting userName={tutorName} />;

      // Render tutor dashboard
      return (
        <>
          <UnauthorizedAccessToast />
          <AppHeader title={dynamicTitle} />
          <PageBody>
            {!sessionData.length ? (
              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-700">
                  You haven&apos;t created any classes yet. Create your first
                  class to get started!
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
      const upcomingSessions = await getAllUpcomingSessionsByStudentIdPerWeek(
        client,
        user.id,
      );

      // Generate dynamic greeting for student
      const studentName = userData.first_name ? `${userData.first_name}` : 'Student';
      const dynamicTitle = <TimezoneGreeting userName={studentName} />;

      // Render student dashboard
      return (
        <>
          <UnauthorizedAccessToast />
          <AppHeader title={dynamicTitle} />
          <PageBody>
            {!upcomingSessions.length ? (
              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-700">
                  You aren&apos;t enrolled in any classes yet. Browse available
                  classes to get started!
                </AlertDescription>
              </Alert>
            ) : (
              <StudentDashboard
                upcomingSessionData={upcomingSessions}
                studentId={user.id}
              />
            )}
          </PageBody>
        </>
      );
    } else if (userRole === 'admin') {
      const allUpcomingSessions =
        await getTodaysAllUpcommingSessionsData(client);

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
    throw new Error('Invalid user role');
  } catch (error: any) {
    // Check if it's a redirect error and re-throw it if so
    if (error?.digest?.includes('NEXT_REDIRECT')) {
      throw error;
    }

    // Handle any other errors
    console.error('Dashboard error:', error);
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
              Unable to load dashboard data. Please try refreshing the page or
              contact support if the problem persists.
            </AlertDescription>
          </Alert>
        </PageBody>
      </>
    );
  }
}

export default DashboardPage;
