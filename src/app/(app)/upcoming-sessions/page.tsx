import AppHeader from '~/app/(app)/components/AppHeader';
import getSupabaseServerComponentClient from '~/core/supabase/server-component-client';
import { PageBody } from '~/core/ui/Page';
import { getAllUpcommingSessionsByTutorIdData, getAllUpcommingSessionsByTutorIdDataPerWeek } from '~/lib/sessions/database/queries';
import UpcomingClasses from '../components/upcoming-sessions/UpcomingSessions';
import UpcomingSessionClient from '../components/upcoming-sessions/UpcomingSessionClient';

export const metadata = {
  title: 'Sessions',
};

async function UpcomingSessionsPage() {
  const client = getSupabaseServerComponentClient();
  const { data: user, error } = await client.auth.getUser();
  // console.log('-----UpcomingSessionsPage-------auth-User:', user);
  const sessionData = await getAllUpcommingSessionsByTutorIdDataPerWeek(
    client,
    user?.user?.id || '',
  );
  // console.log('UpcomingSessions-server-component------', sessionData);

  return (
    <>
      <AppHeader title={''} description={''} />

      <PageBody>
        <UpcomingSessionClient upcomingSessionData={sessionData} />
      </PageBody>
    </>
  );
}

export default UpcomingSessionsPage;