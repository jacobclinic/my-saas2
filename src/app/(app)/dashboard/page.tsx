import AppHeader from '~/app/(app)/components/AppHeader';
import { PageBody } from '~/core/ui/Page';
import TutorDashboard from '../components/tutor-dashboard/TutorDashboard';

export const metadata = {
  title: 'Dashboard',
};

function DashboardPage() {
  return (
    <>
      <AppHeader
        title={''}
        description={
          ""
        }
      />

      <PageBody>
        <TutorDashboard />
      </PageBody>
    </>
  );
}

export default DashboardPage;
