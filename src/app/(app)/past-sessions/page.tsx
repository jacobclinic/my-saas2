import AppHeader from '~/app/(app)/components/AppHeader';
import getSupabaseServerComponentClient from '~/core/supabase/server-component-client';
import { PageBody } from '~/core/ui/Page';
import {
  getAllPastSessionsByStudentIdData,
  getAllPastSessionsByTutorIdData,
  getAllPastSessionsDataAdmin,
} from '~/lib/sessions/database/queries';
import PastSessionsClient from '../components/past-sessions/PastSessionClient';
import StudentPastSessionClient from '../components/past-sessions-student/StudentPastSessionClient';
import PastSessionsAdmin from '../components/admin/past-session/PastSessionsAdmin';

export const metadata = {
  title: 'Sessions',
};

async function PastSessionsPage() {
  const client = getSupabaseServerComponentClient();
  const { data: user } = await client.auth.getUser();

  // Fetch all sessions (without pagination)
  const tutorSessionData = await getAllPastSessionsByTutorIdData(
    client,
    user?.user?.id || '',
  );

  const studentSessionData = await getAllPastSessionsByStudentIdData(
    client,
    user?.user?.id || '',
  );

  const pastSessionsAdmin = await getAllPastSessionsDataAdmin(client);

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
          <StudentPastSessionClient
            pastSessionData={studentSessionData}
            userId={user.user!.id}
          />
        ) : userRole === 'tutor' ? (
          <PastSessionsClient initialSessions={tutorSessionData} />
        ) : (
          <PastSessionsAdmin pastSessionsData={pastSessionsAdmin} />
        )}
      </PageBody>
    </>
  );
}

export default PastSessionsPage;
