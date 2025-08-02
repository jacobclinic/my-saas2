import { PageBody } from '~/core/ui/Page';

import getSupabaseServerComponentClient from '~/core/supabase/server-component-client';
// import { getSessionDataById } from '~/lib/sessions/database/queries';
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

  return (
    <>
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

