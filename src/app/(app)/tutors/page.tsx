import loadDynamic from 'next/dynamic';
import AppHeader from '~/app/(app)/components/AppHeader';
import getSupabaseServerComponentClient from '~/core/supabase/server-component-client';
import { PageBody } from '~/core/ui/Page';
import { USER_ROLES } from '~/lib/constants';
import { getAllTutorsWithDetails } from '~/lib/user/database/queries';

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
  const tutorsData = await getAllTutorsWithDetails(client, USER_ROLES.TUTOR);
  return (
    <PageBody>
      <TutorsList tutorsData={tutorsData} />
    </PageBody>
  );
}

export default TutorsPage;
