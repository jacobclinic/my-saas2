import loadDynamic from 'next/dynamic';
import AppHeader from '~/app/(app)/components/AppHeader';
import { PageBody } from '~/core/ui/Page';
import SessionView from '../../components/sessions/session-view/SessionView';

import getSupabaseServerComponentClient from '~/core/supabase/server-component-client';
// import { getSessionDataById } from '~/lib/sessions/database/queries';
import { SessionsWithTableData } from '~/lib/sessions/types/session';
import Button from '~/core/ui/Button';

interface Params {
  params: {
    id: string;
  };
}

export const metadata = {
  title: 'Sessions',
};

export default async function SessionViewPage({ params }: Params) {
  const client = getSupabaseServerComponentClient();
  // const sessionData = await getSessionDataById(client, params.id) as SessionsWithTableData;
  // console.log("sessionData-------", sessionData);

  return (
    <>
      {/* <AppHeader
        title={`${new Date(sessionData?.startTime || '').toLocaleString()} - ${sessionData?.class?.name}`}
        description={`Attendance - ${sessionData?.noOfAtendedStudents}, Status - ${sessionData?.status}`}
      /> */}

      <PageBody>
        <div className='flex gap-4 self-end'>
            <div className='flex gap-2'>
              <Button
                variant="default"
              >
                View Recording
              </Button>
          </div>
        </div>
        {/* <SessionView sessionData={sessionData}/> */}
      </PageBody>
    </>
  );
};

