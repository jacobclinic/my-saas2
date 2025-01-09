import AppHeader from '~/app/(app)/components/AppHeader';
import getSupabaseServerComponentClient from '~/core/supabase/server-component-client';
import { PageBody } from '~/core/ui/Page';
import ClassesList from '../components/classes/ClassesList';
import { getAllClassesByTutorIdData } from '~/lib/classes/database/queries';

export const metadata = {
  title: 'Sessions',
};

async function ClassesPage() {
  const client = getSupabaseServerComponentClient();
  const { data: user, error } = await client.auth.getUser();
  console.log('-----ClassesPage-------auth-User:', user);
  const classesData = await getAllClassesByTutorIdData(client, user?.user?.id || "");
  console.log("Classes-server-component------", classesData);
  
  return (
    <>
      <AppHeader
        title={''}
        description={
          ""
        }
      />

      <PageBody>
        <ClassesList classesData={classesData}/>
      </PageBody>
    </>
  );
}

export default ClassesPage;
