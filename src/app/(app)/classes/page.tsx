import loadDynamic from 'next/dynamic';
import AppHeader from '~/app/(app)/components/AppHeader';
import { PageBody } from '~/core/ui/Page';

const ClassesList = loadDynamic(
  () => import('~/app/(app)/components/classes/ClassesList'),
  {
    ssr: false,
  },
);

export const metadata = {
  title: 'Classes',
};

function ClassesPage() {
  return (
    <>
      <AppHeader
        title={'Classes'}
        description={
          "All the classes."
        }
      />

      <PageBody className='overflow-y-auto'>
        <ClassesList />
      </PageBody>
    </>
  );
}

export default ClassesPage;
