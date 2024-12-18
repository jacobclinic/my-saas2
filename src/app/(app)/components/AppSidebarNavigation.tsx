'use client';

import { SidebarItem, SidebarDivider, SidebarGroup } from '~/core/ui/Sidebar';
import useUserRole from '~/lib/user/hooks/use-userRole';

import NAVIGATION_CONFIG from '~/navigation.config';

function AppSidebarNavigation() {
  const { data: userRole } = useUserRole();

  // Helper function to check if the role has access
  const hasAccess = (itemRoles?: string[]) => {
    if (!itemRoles) return true; // If roles are not defined, allow access
    if (!userRole) return false; // If role is not defined, deny access
    return itemRoles.includes(userRole);
  };

  return (
    <>
      {NAVIGATION_CONFIG.items.map((item, index) => {
        if ('divider' in item) {
          return <SidebarDivider key={index} />;
        }

        if ('children' in item) {
          const visibleChildren = item.children.filter((child) =>
            hasAccess(child.userRole)
          );

          // Only render the group if it has visible children
          if (visibleChildren.length === 0) return null;
          return (
            <SidebarGroup
              key={item.label}
              label={item.label}
              collapsible={item.collapsible}
              collapsed={item.collapsed}
            >
              {item.children.map((child) => {
                return (
                  <SidebarItem
                    key={child.path}
                    end={child.end}
                    path={child.path}
                    Icon={child.Icon}
                  >
                    {child.label}
                  </SidebarItem>
                );
              })}
            </SidebarGroup>
          );
        }

        return (
          <SidebarItem
            key={item.path}
            end={item.end}
            path={item.path}
            Icon={item.Icon}
          >
            {item.label}
          </SidebarItem>
        );
      })}
    </>
  );
}

export default AppSidebarNavigation;
