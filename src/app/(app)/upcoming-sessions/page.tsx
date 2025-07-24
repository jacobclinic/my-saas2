import AppHeader from '~/app/(app)/components/AppHeader';
import getSupabaseServerComponentClient from '~/core/supabase/server-component-client';
import { PageBody } from '~/core/ui/Page';
import {
  getAllUpcomingSessionsByStudentIdPerWeek,
  getAllUpcommingSessionsByTutorIdDataPerWeek,
} from '~/lib/sessions/database/queries';
import UpcomingSessionClient from '../components/upcoming-sessions/UpcomingSessionClient';
import { redirect } from 'next/navigation';
import StudentUpcomingSessionClient from '../components/upcoming-sessions-student/StudentUpcomingSessionClient';
import UpcomingSessionsAdmin from '../components/admin/upcoming-sessions/UpcomingSessionsAdmin';
import { getAllUpcominSessionsAdmin } from '~/lib/classes/server-actions-v2';
import TimezoneIndicator from '../components/TimezoneIndicator';

export const metadata = {
  title: 'Sessions',
};

async function UpcomingSessionsPage() {
  const client = getSupabaseServerComponentClient();

  const { data: user, error: authError } = await client.auth.getUser();

  if (authError || !user?.user.id) {
    console.error('Authentication error:', authError);
    redirect('/auth/sign-in');
  }

  // Get user role
  const { data: userData, error: userError } = await client
    .from('users')
    .select('user_role')
    .eq('id', user.user!.id)
    .single();

  if (userError) {
    throw userError;
  }

  const userRole = userData?.user_role;

  if (!userRole) {
    console.error('User role not found:', userRole);
    redirect('/auth/sign-in');
  }

  let upcomingSessionData = null;

  if (userRole === 'admin') {
    // Fetch initial payment data for admin
    upcomingSessionData = await getAllUpcominSessionsAdmin();
  } else if (userRole === 'student') {
    // For students, show their own payment history
    upcomingSessionData = await getAllUpcomingSessionsByStudentIdPerWeek(
      client,
      user.user.id,
    );
  } else if (userRole === 'tutor') {
    // For tutors, show their own payment history
    upcomingSessionData = await getAllUpcommingSessionsByTutorIdDataPerWeek(
      client,
      user.user.id,
    );
  } else {
    console.error('Unknown user role:', userRole);
    redirect('/auth/sign-in');
  }

  return (
    <>
      {userRole !== 'admin' && (
        <AppHeader title={'Upcoming Classes'} description={''}>
          <div className="lg:w-[225px]">
            <TimezoneIndicator />
          </div>
        </AppHeader>
      )}

      <PageBody>
        {userRole === 'student' ? (
          <StudentUpcomingSessionClient
            upcomingSessionData={upcomingSessionData}
            userId={user.user.id}
          />
        ) : userRole === 'tutor' ? (
          <UpcomingSessionClient upcomingSessionData={upcomingSessionData} />
        ) : (
          <UpcomingSessionsAdmin upcomingSessionData={upcomingSessionData} />
        )}
      </PageBody>
    </>
  );
}

export default UpcomingSessionsPage;
