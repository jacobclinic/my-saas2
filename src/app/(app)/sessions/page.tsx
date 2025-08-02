import loadDynamic from 'next/dynamic';
import AppHeader from '~/app/(app)/components/AppHeader';
import getSupabaseServerComponentClient from '~/core/supabase/server-component-client';
import { PageBody } from '~/core/ui/Page';

export const metadata = {
  title: 'Sessions',
};

async function SessionsPage() {
  const client = getSupabaseServerComponentClient();

  return (
    <>
      <AppHeader
        title={'Sessions'}
        description={
          "All the sessions."
        }
      />

      <PageBody>

      </PageBody>
    </>
  );
}

export default SessionsPage;
