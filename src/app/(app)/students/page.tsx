import loadDynamic from 'next/dynamic';
import AppHeader from '~/app/(app)/components/AppHeader';
import { PageBody } from '~/core/ui/Page';

const StudentsList = loadDynamic(
  () => import('~/app/(app)/components/students/StudentsList'),
  {
    ssr: false,
  },
);

export const metadata = {
  title: 'Students',
};

function StudentsPage() {
  return (
    <>
      <AppHeader
        title={'Students'}
        description={
          "All the students signed up to the app."
        }
      />

      <PageBody>
        <StudentsList />
      </PageBody>
    </>
  );
}

export default StudentsPage;
