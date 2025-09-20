import { use } from 'react';

import AdminHeader from '~/app/admin/components/AdminHeader';
import AdminGuard from '~/app/admin/components/AdminGuard';
import { PageBody } from '~/core/ui/Page';
import CronJobsManager from './components/CronJobsManager';

import configuration from '~/configuration';

export const metadata = {
  title: `Cron Jobs | ${configuration.site.siteName}`,
};

function AdminCronPage() {
  return (
    <>
      <AdminHeader>Cron Jobs Management</AdminHeader>

      <PageBody>
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Daily Cron Jobs</h1>
            <p className="text-gray-600 mt-2">
              Manually trigger daily cron jobs for testing and maintenance purposes.
            </p>
          </div>
          <CronJobsManager />
        </div>
      </PageBody>
    </>
  );
}

export default AdminGuard(AdminCronPage);