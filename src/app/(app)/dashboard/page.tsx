import { redirect } from 'next/navigation';
import AppHeader from '~/app/(app)/components/AppHeader';
import { PageBody } from '~/core/ui/Page';
import TutorDashboard from '../components/tutor-dashboard/TutorDashboard';
import getSupabaseServerComponentClient from '~/core/supabase/server-component-client';
import { getAllUpcommingSessionsByTutorIdData } from '~/lib/sessions/database/queries';
import { getAllClassesByTutorIdData } from '~/lib/classes/database/queries';
import { Alert, AlertDescription } from '../components/base-v2/ui/Alert';
import { Info } from 'lucide-react';

export const metadata = {
  title: 'Dashboard',
};

async function DashboardPage() {
  const client = getSupabaseServerComponentClient();

  try {
    // Get user and handle authentication
    const { data: { user }, error: authError } = await client.auth.getUser();
    console.log('-----DashboardPage-------auth-User:', user);

    // Handle authentication error
    if (authError) {
      console.error('Authentication error:', authError);
      redirect('/auth/sign-in');
    }

    // Handle no user found
    if (!user?.id) {
      console.error('No user found');
      redirect('/auth/sign-in');
    }

    // Fetch dashboard data
    const [sessionData, classesData] = await Promise.all([
      getAllUpcommingSessionsByTutorIdData(client, user.id, true),
      getAllClassesByTutorIdData(client, user.id, true)
    ]);
    console.log("DashboardPage-UpcomingSession-server-component------", sessionData);
    console.log("DashboardPage-Classes-server-component------", classesData);

    // Handle case when no data is found
    if (!sessionData.length && !classesData.length) {
      return (
        <>
          <AppHeader
            title="Welcome to Your Dashboard"
            description="Get started by creating your first class"
          />
          <PageBody>
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-700">
                You havent created any classes yet. Create your first class to get started!
              </AlertDescription>
            </Alert>
            <TutorDashboard 
              nextSessionData={[]} 
              activeClassesData={[]} 
            />
          </PageBody>
        </>
      );
    }

    // Return dashboard with data
    return (
      <>
        <AppHeader
          title="Dashboard"
          description={
            `Welcome back! You have ${classesData.length} active ${
              classesData.length === 1 ? 'class' : 'classes'
            }${sessionData.length ? ', and the nearest upcoming session is displayed here' : ' and no upcoming sessions'}.`
          }
        />
        <PageBody>
          <TutorDashboard
            nextSessionData={sessionData}
            activeClassesData={classesData}
          />
        </PageBody>
      </>
    );

  } catch (error) {
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
              Unable to load dashboard data. Please try refreshing the page or contact support if the problem persists.
            </AlertDescription>
          </Alert>
        </PageBody>
      </>
    );
  }
}

export default DashboardPage;