import AppHeader from '~/app/(app)/components/AppHeader';
import getSupabaseServerComponentClient from '~/core/supabase/server-component-client';
import { PageBody } from '~/core/ui/Page';
import { getAllUpcommingSessionsByTutorIdData } from '~/lib/sessions/database/queries';
import UpcomingClasses from '../components/upcoming-sessions/UpcomingSessions';
import { UpcomingSession } from '~/lib/sessions/types/session-v2';

export const metadata = {
  title: 'Sessions',
};

async function UpcomingSessionsPage() {
  const client = getSupabaseServerComponentClient();
  // const sessionData = await getAllUpcommingSessionsData(client,"eeca8510-a96f-45c5-96b3-7b3d35a1a72f") as SessionsWithTableData[];
  const sessionData = await getAllUpcommingSessionsByTutorIdData(client,"95572317-8cf6-4b15-bd5a-e8ccf420110f") as UpcomingSession[];
  // const sessionData = await getAllUpcommingSessionsData(client) as SessionsWithTableData[];
  console.log("UpcomingSessions-server-component------", sessionData);
  
  return (
    <>
      <AppHeader
        title={''}
        description={
          ""
        }
      />

      <PageBody>
        <UpcomingClasses />
      </PageBody>
    </>
  );
}

export default UpcomingSessionsPage;
