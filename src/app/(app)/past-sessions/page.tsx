import AppHeader from '~/app/(app)/components/AppHeader';
import getSupabaseServerComponentClient from '~/core/supabase/server-component-client';
import { PageBody } from '~/core/ui/Page';
import { getAllPastSessionsByTutorIdData } from '~/lib/sessions/database/queries';
import PastSessionsClient from './PastSessionClient';

export const metadata = {
  title: 'Sessions',
};

async function PastSessionsPage() {
  const client = getSupabaseServerComponentClient();
  const { data: user } = await client.auth.getUser();

  // Fetch all sessions (without pagination)
  const sessionData = await getAllPastSessionsByTutorIdData(
    client,
    user?.user?.id || ''
  );

  return (
    <>
      <AppHeader title={''} description={''} />
      <PageBody>
        <PastSessionsClient initialSessions={sessionData} />
      </PageBody>
    </>
  );
}

export default PastSessionsPage;