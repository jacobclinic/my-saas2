import loadDynamic from 'next/dynamic';
import AppHeader from '~/app/(app)/components/AppHeader';
import getSupabaseServerComponentClient from '~/core/supabase/server-component-client';
import { PageBody } from '~/core/ui/Page';
import { USER_ROLES } from '~/lib/constants';
import { getAllUsersByUserRoleData } from '~/lib/user/database/queries';

const StudentsList = loadDynamic(
  () => import('~/app/(app)/components/students/StudentsList'),
  {
    ssr: false,
  },
);

export const metadata = {
  title: 'Students',
};

async function StudentsPage() {
  const client = getSupabaseServerComponentClient();
  const studentsData = await getAllUsersByUserRoleData(client, USER_ROLES.STUDENT);
  console.log("sessionData-server-component------", studentsData);
  return (
    <>
      <AppHeader
        title={'Students'}
        description={
          "All the students signed up to the app."
        }
      />

      <PageBody>
        <StudentsList studentsData={studentsData}/>
      </PageBody>
    </>
  );
}

export default StudentsPage;
