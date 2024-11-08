import loadDynamic from 'next/dynamic';
import AppHeader from '~/app/(app)/components/AppHeader';
import { PageBody } from '~/core/ui/Page';

const PaymentsList = loadDynamic(
  () => import('~/app/(app)/components/payments/PaymentsList'),
  {
    ssr: false,
  },
);

export const metadata = {
  title: 'Payments',
};

function PaymentsPage() {
  return (
    <>
      <AppHeader
        title={'Payments'}
        description={
          "All the payments."
        }
      />

      <PageBody>
        <PaymentsList />
      </PageBody>
    </>
  );
}

export default PaymentsPage;
