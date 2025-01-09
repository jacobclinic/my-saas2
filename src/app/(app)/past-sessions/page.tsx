import AppHeader from '~/app/(app)/components/AppHeader';
import getSupabaseServerComponentClient from '~/core/supabase/server-component-client';
import { PageBody } from '~/core/ui/Page';
import { getAllPastSessionsByTutorIdData } from '~/lib/sessions/database/queries';
import PastSessions from '../components/past-sessions/PastSessions';

export const metadata = {
  title: 'Sessions',
};

async function PastSessionsPage() {
  const client = getSupabaseServerComponentClient();
  const { data: user, error } = await client.auth.getUser();
  console.log('-----PastSessionsPage-------auth-User:', user);
  const sessionData = await getAllPastSessionsByTutorIdData(client, user?.user?.id || "");
  console.log("PastSessions-server-component------", sessionData);
  
  return (
    <>
      <AppHeader
        title={''}
        description={
          ""
        }
      />

      <PageBody>
        <PastSessions pastSessionsData={sessionData}/>
      </PageBody>
    </>
  );
}

export default PastSessionsPage;
