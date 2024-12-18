import loadDynamic from 'next/dynamic';
import AppHeader from '~/app/(app)/components/AppHeader';
import getSupabaseServerComponentClient from '~/core/supabase/server-component-client';
import { PageBody } from '~/core/ui/Page';
import { getAllSessionsData } from '~/lib/sessions/database/queries';
import { SessionsWithTableData } from '~/lib/sessions/types/session';

const SessionsList = loadDynamic(
  () => import('~/app/(app)/components/sessions/SessionsList'),
  {
    ssr: false,
  },
);

export const metadata = {
  title: 'Sessions',
};

async function SessionsPage() {
  const client = getSupabaseServerComponentClient();
  const sessionData = await getAllSessionsData(client) as SessionsWithTableData[];
  console.log("sessionData-server-component------", sessionData);
  
  return (
    <>
      <AppHeader
        title={'Sessions'}
        description={
          "All the sessions."
        }
      />

      <PageBody>
        <SessionsList sessionData={sessionData}/>
      </PageBody>
    </>
  );
}

export default SessionsPage;
