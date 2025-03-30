import AppHeader from '~/app/(app)/components/AppHeader';
import getSupabaseServerComponentClient from '~/core/supabase/server-component-client';
import { PageBody } from '~/core/ui/Page';
import {
  getAllUpcomingSessionsByStudentIdData,
  getAllUpcomingSessionsByStudentIdPerWeek,
  getAllUpcommingSessionsByTutorIdData,
  getAllUpcommingSessionsByTutorIdDataPerWeek,
} from '~/lib/sessions/database/queries';
import UpcomingClasses from '../components/upcoming-sessions/UpcomingSessions';
import UpcomingSessionClient from '../components/upcoming-sessions/UpcomingSessionClient';
import { redirect } from 'next/navigation';
import StudentUpcomingSessions from '../components/upcoming-sessions-student/StudentUpcomingSessions';
import StudentUpcomingSessionClient from '../components/upcoming-sessions-student/StudentUpcomingSessionClient';

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

  const studentSessionData = await getAllUpcomingSessionsByStudentIdData(
    client,
    user?.user?.id || '',
  )

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
          <StudentUpcomingSessionClient upcomingSessionData={studentSessionData} userId={user.user.id}/>
        ) : (
          <UpcomingSessionClient upcomingSessionData={tutorSessionData}/>
        )}
      </PageBody>
    </>
  );
}

export default UpcomingSessionsPage;
