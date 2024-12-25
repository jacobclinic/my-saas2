import AppHeader from '~/app/(app)/components/AppHeader';
import { PageBody } from '~/core/ui/Page';
import TutorPayments from '../components/payments/TutorPaymentList';
import getSupabaseServerComponentClient from '~/core/supabase/server-component-client';

export const metadata = {
  title: 'Payments',
};

function PaymentsPage() {
  // const client = getSupabaseServerComponentClient();
  return (
    <>
      <AppHeader
        title={''}
        description={
          ""
        }
      />

      <PageBody>
        <TutorPayments />
      </PageBody>
    </>
  );
}

export default PaymentsPage;
