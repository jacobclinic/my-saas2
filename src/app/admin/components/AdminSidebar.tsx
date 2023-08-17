'use client';

import { HomeIcon, UserIcon } from '@heroicons/react/24/outline';
import Sidebar, { SidebarItem } from '~/core/ui/Sidebar';

function AdminSidebar() {
  return (
    <Sidebar>
      <SidebarItem
        end
        path={'/admin'}
        Icon={() => <HomeIcon className={'h-6'} />}
      >
        Admin
      </SidebarItem>

      <SidebarItem
        path={'/admin/users'}
        Icon={() => <UserIcon className={'h-6'} />}
      >
        Users
      </SidebarItem>
    </Sidebar>
  );
}

export default AdminSidebar;
