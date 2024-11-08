import loadDynamic from 'next/dynamic';
import AppHeader from '~/app/(app)/components/AppHeader';
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

function TutorsPage() {
  return (
    <>
      <AppHeader
        title={'Tutors'}
        description={
          "All the tutors signed up to the app."
        }
      />

      <PageBody>
        <TutorsList />
      </PageBody>
    </>
  );
}

export default TutorsPage;
