'use client';

import Link from 'next/link';

import {
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/core/ui/Dropdown';

import NAVIGATION_CONFIG from '../navigation.config';
import useSignOut from '~/core/hooks/use-sign-out';
import useUserRole from '~/lib/user/hooks/use-userRole';

const MobileAppNavigation = () => {
  const { data: userRole } = useUserRole();

  // Helper function to check if the role has access
  const hasAccess = (itemRoles?: string[]) => {
    if (!itemRoles) return true; // If roles are not defined, allow access
    if (!userRole) return false; // If role is not defined, deny access
    return itemRoles.includes(userRole);
  };

  const Links = NAVIGATION_CONFIG.items.map((item, index) => {
    if ('children' in item) {
      const visibleChildren = item.children.filter((child) =>
        hasAccess(child.userRole)
      );

      // Only render the group's children if they have visible items
      if (visibleChildren.length === 0) return null;

      return visibleChildren.map((child) => {
        return (
          <DropdownLink
            key={child.path}
            Icon={child.Icon}
            path={child.path}
            label={child.label}
          />
        );
      });
    }

    if ('divider' in item) {
      return <DropdownMenuSeparator key={index} />;
    }

    // Handle top-level navigation items
    if (!hasAccess(item.userRole)) {
      return null; // Skip rendering if the user doesn't have access
    }

    return (
      <DropdownLink
        key={item.path}
        Icon={item.Icon}
        path={item.path}
        label={item.label}
      />
    );
  }).filter(Boolean); // Remove null entries

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Bars3Icon className={'h-9'} />
      </DropdownMenuTrigger>

      <DropdownMenuContent sideOffset={10} className={'rounded-none w-screen'}>
        {Links}

        <DropdownMenuSeparator />
        <SignOutDropdownItem />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default MobileAppNavigation;

function DropdownLink(
  props: React.PropsWithChildren<{
    path: string;
    label: string;
    Icon: React.ElementType;
  }>,
) {
  return (
    <DropdownMenuItem asChild key={props.path}>
      <Link
        href={props.path}
        className={'flex w-full items-center space-x-4 h-12'}
      >
        <props.Icon className={'h-6'} />

        <span>{props.label}</span>
      </Link>
    </DropdownMenuItem>
  );
}

function SignOutDropdownItem() {
  const signOut = useSignOut();

  return (
    <DropdownMenuItem
      className={'flex w-full items-center space-x-4 h-12'}
      onClick={signOut}
    >
      <ArrowLeftOnRectangleIcon className={'h-6'} />

      <span>Sign Out</span>
    </DropdownMenuItem>
  );
}
