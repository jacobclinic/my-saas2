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
import TimezoneIndicator from '../components/TimezoneIndicator';

export const metadata = {
  title: 'Sessions',
};

async function PastSessionsPage() {
  const client = getSupabaseServerComponentClient();
  const { data: user } = await client.auth.getUser();
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

  // Fetch all sessions (without pagination)
  if (!userRole) {
    window.location.href = `/auth/sign-in`;
  }

  let sessionData;

  if (userRole === 'admin') {
    sessionData = await getAllPastSessionsDataAdmin(client);
  } else if (userRole === 'tutor') {
    sessionData = await getAllPastSessionsByTutorIdData(
      client,
      user?.user?.id || '',
    );
  } else if (userRole === 'student') {
    sessionData = await getAllPastSessionsByStudentIdData(
      client,
      user?.user?.id || '',
    );
  }

  return (
    <>
      {userRole !== 'admin' && (
        <AppHeader title={'Past Classes'} description={''}>
          <div className="lg:w-[225px]">
            <TimezoneIndicator />
          </div>
        </AppHeader>
      )}
      <PageBody>
        {userRole === 'student' ? (
          <StudentPastSessionClient
            pastSessionData={sessionData!}
            userId={user.user!.id}
          />
        ) : userRole === 'tutor' ? (
          <PastSessionsClient initialSessions={sessionData!} />
        ) : (
          <PastSessionsAdmin pastSessionsData={sessionData!} />
        )}
      </PageBody>
    </>
  );
}

export default PastSessionsPage;
