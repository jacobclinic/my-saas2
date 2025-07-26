import loadDynamic from 'next/dynamic';
import AppHeader from '~/app/(app)/components/AppHeader';
import getSupabaseServerComponentClient from '~/core/supabase/server-component-client';
import { PageBody } from '~/core/ui/Page';

const TutorsList = loadDynamic(
  () => import('~/app/(app)/components/tutors/TutorsList'),
  {
    ssr: false,
  },
);

export const metadata = {
  title: 'Tutors',
};

async function TutorsPage() {
  const client = getSupabaseServerComponentClient();
  // const tutorsData = await getAllUsersByUserRoleData(client, USER_ROLES.TUTOR);
  // console.log("sessionData-server-component------", tutorsData);
  return (
    <>
      <AppHeader
        title={'Tutors'}
        description={
          "All the tutors signed up to the app."
        }
      />

      <PageBody>
        {/* <TutorsList tutorsData={tutorsData}/> */}
      </PageBody>
    </>
  );
}

export default TutorsPage;
