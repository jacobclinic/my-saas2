import AppHeader from '~/app/(app)/components/AppHeader';
import getSupabaseServerComponentClient from '~/core/supabase/server-component-client';
import { PageBody } from '~/core/ui/Page';
import { getAllSessionsData } from '~/lib/sessions/database/queries';
import { SessionsWithTableData } from '~/lib/sessions/types/session';
import ClassesList from '../components/classes/ClassesList';
import TutorDashboard from '../components/tutor-dashboard/TutorDashboard';
import StudentPortal from '../components/classes/StudentPortal';
import StudentRegistration from '../components/classes/StudentRegistration';

export const metadata = {
  title: 'Sessions',
};

async function PastSessionsPage() {
  const client = getSupabaseServerComponentClient();
  // const sessionData = await getAllSessionsData(client) as SessionsWithTableData[];
  // console.log("PastSessions-server-component------", sessionData);
  
  return (
    <>
      <AppHeader
        title={''}
        description={
          ""
        }
      />

      <PageBody>
        <ClassesList />
        {/* <TutorDashboard /> */}
        {/* <StudentPortal /> */}
        {/* <StudentRegistration /> */}
      </PageBody>
    </>
  );
}

export default PastSessionsPage;
