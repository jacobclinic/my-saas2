import loadDynamic from 'next/dynamic';
import AppHeader from '~/app/(app)/components/AppHeader';
import { PageBody } from '~/core/ui/Page';
// import ClassView from '../../components/classes-old/class-view/ClassView';

import getSupabaseServerComponentClient from '~/core/supabase/server-component-client';
import { getClassDataById } from '~/lib/classes/database/queries';
import CreateClassModal from '../../components/classes-old/CreateClassModal';
import { ClassWithTutorAndEnrollment } from '~/lib/classes/types/class';

interface Params {
  params: {
    id: string;
  };
}

// const ClassesList = loadDynamic(
//   () => import('~/app/(app)/components/classes/ClassesList'),
//   {
//     ssr: false,
//   },
// );

export const metadata = {
  title: 'Classes',
};

export default async function ClassViewPage({ params }: Params) {
  const client = getSupabaseServerComponentClient();
  const classData = await getClassDataById(client, params.id) as ClassWithTutorAndEnrollment;
  // console.log("classData-------", classData);


  return (
    <>
      <AppHeader
        title={classData?.name}
        description={classData?.description}
      />

      <PageBody>
        <div className='flex gap-4 self-end'>
          {/* <CreateClassModal />
          <CreateClassModal /> */}
        </div>
        {/* <ClassView classData={classData}/> */}
      </PageBody>
    </>
  );
};

