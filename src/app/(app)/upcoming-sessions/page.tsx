import AppHeader from '~/app/(app)/components/AppHeader';
import getSupabaseServerComponentClient from '~/core/supabase/server-component-client';
import { PageBody } from '~/core/ui/Page';
import {
  getAllUpcomingSessionsByStudentIdData,
  getAllUpcomingSessionsByStudentIdPerWeek,
  getAllUpcommingSessionsByTutorIdData,
  getAllUpcommingSessionsByTutorIdDataPerWeek,
} from '~/lib/sessions/database/queries';
import UpcomingSessionClient from '../components/upcoming-sessions/UpcomingSessionClient';
import { redirect } from 'next/navigation';
import StudentUpcomingSessionClient from '../components/upcoming-sessions-student/StudentUpcomingSessionClient';
import UpcomingSessionsAdmin from '../components/admin/upcoming-sessions/UpcomingSessionsAdmin';
import { getAllUpcominSessionsAdmin } from '~/lib/classes/server-actions-v2';

export const metadata = {
  title: 'Sessions',
};


async function UpcomingSessionsPage() {
  const client = getSupabaseServerComponentClient();


  const { data: user, error: authError } = await client.auth.getUser();
  // console.log('-----UpcomingSessionsPage-------auth-User:', user);
  const tutorSessionData = await getAllUpcommingSessionsByTutorIdDataPerWeek(
    client,
    user?.user?.id || '',
  );

  const studentSessionData = await getAllUpcomingSessionsByStudentIdPerWeek(
    client,
    user?.user?.id || '',
  );

  const adminSessionData = await getAllUpcominSessionsAdmin()

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

  return (
    <>
      <AppHeader title={''} description={''} />

      <PageBody>
        {userRole === 'student' ? (
          <StudentUpcomingSessionClient
            upcomingSessionData={studentSessionData}
            userId={user.user.id}
          />
        ) : userRole === 'tutor' ? (
          <UpcomingSessionClient upcomingSessionData={tutorSessionData} />
        ) : (
          <UpcomingSessionsAdmin upcomingSessionData={adminSessionData} />
        )}
      </PageBody>
    </>
  );
}

export default UpcomingSessionsPage;
