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
import { getTutorDashboardData } from '~/lib/tutorStats/database/queries';
import DashboardClientPage from './DashboardClientPage';

export const metadata = {
  title: 'Dashboard',
};

async function DashboardPage() {
  const client = getSupabaseServerComponentClient();

  try {
    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser();

    if (authError || !user?.id) {
      console.error('Authentication error:', authError);
      redirect('/auth/sign-in');
    }

    const { data: userData, error: userError } = await client
      .from('users')
      .select('user_role')
      .eq('id', user.id)
      .single();

    if (userError) {
      throw userError;
    }

    const userRole = userData?.user_role || 'admin';

    let sessionData: any[] = [];
    let tutorStat = null;
    let allUpcomingSessions: any[] = [];

    if (userRole === 'tutor') {
      [sessionData] = await Promise.all([
        getAllUpcommingSessionsByTutorIdData(client, user.id, true),
      ]);
      tutorStat = await getTutorDashboardData(client, user.id);
    } else if (userRole === 'student') {
      sessionData = await getAllUpcomingSessionsByStudentIdPerWeek(
        client,
        user.id,
      );
    } else if (userRole === 'admin') {
      allUpcomingSessions = await getTodaysAllUpcommingSessionsData(client);
    }

    return (
      <DashboardClientPage
        user={user}
        userRole={userRole}
        sessionData={sessionData}
        tutorStat={tutorStat}
        allUpcomingSessions={allUpcomingSessions}
      />
    );
  } catch (error) {
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
