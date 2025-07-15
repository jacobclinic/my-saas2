'use client';

import Link from 'next/link';


import {
  DropdownMenuSeparator,
} from '~/core/ui/Dropdown';

import NAVIGATION_CONFIG from '../navigation.config';
import useSignOut from '~/core/hooks/use-sign-out';
import { LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '~/app/(app)/lib/utils';
import { usePathname } from 'next/navigation';
import Logo from '~/core/ui/Logo';

const MobileAppNavigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const Links = NAVIGATION_CONFIG.items.map((item, index) => {
    if ('children' in item) {
      return item.children.map((child) => {
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

    return (
      <DropdownLink
        key={item.path}
        Icon={item.Icon}
        path={item.path}
        label={item.label}
      />
    );
  });

  return (
    <div>
      <button
        className="lg:hidden z-50 p-2 bg-white rounded-lg shadow-md"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <div className={cn(
        "p-4 fixed lg:static inset-y-0 left-0 z-40 h-screen w-64 bg-white border-r border-neutral-200 flex flex-col gap-2 transform transition-transform duration-200 ease-in-out lg:transform-none",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className='flex items-center justify-between p-1'>
          <Logo />
          <button
            className="p-2 bg-white rounded-lg"
            onClick={() => setIsMobileMenuOpen(false)}
          >

            <X size={24} />
          </button>
        </div>
        <DropdownMenuSeparator />
        {Links}

        <SignOutDropdownItem />
      </div>
    </div>
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
  const pathname = usePathname();
  const isActive = pathname === props.path;
 
  return (
    <div key={props.path}>
      <Link
        href={props.path}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-200 ease-in-out",
          isActive ? "bg-primary-blue-50 text-primary-blue-800 font-medium" : "text-neutral-600 hover:bg-primary-blue-50/70 hover:text-primary-blue-700"
        )}
      >
        <props.Icon className={'h-6'} />

        <span>{props.label}</span>
      </Link>
    </div>
  );
}

function SignOutDropdownItem() {
  const signOut = useSignOut();

  return (
    <div
      className={'flex w-full items-center space-x-4 h-12 mt-2'}
      onClick={signOut}
    >
      <LogOut size={16} />

      <span>Sign Out</span>
    </div>
  );
}
