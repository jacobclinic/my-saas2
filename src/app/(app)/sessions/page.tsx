import loadDynamic from 'next/dynamic';
import AppHeader from '~/app/(app)/components/AppHeader';
import { PageBody } from '~/core/ui/Page';

const SessionsList = loadDynamic(
  () => import('~/app/(app)/components/sessions/SessionsList'),
  {
    ssr: false,
  },
);

export const metadata = {
  title: 'Sessions',
};

function SessionsPage() {
  return (
    <>
      <AppHeader
        title={'Sessions'}
        description={
          "All the sessions."
        }
      />

      <PageBody>
        <SessionsList />
      </PageBody>
    </>
  );
}

export default SessionsPage;
