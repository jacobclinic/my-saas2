import {
  UserIcon,
  CreditCardIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';

import {
  LayoutDashboard,
  FolderKanban,
  CalendarClock,
  CalendarCheck2,
  Wallet,
  User,
  CreditCard,
  ChevronRight,
  Menu,
  X,
  LogOut,
} from 'lucide-react';

type Divider = {
  divider: true;
};

type NavigationItemLink = {
  label: string;
  path: string;
  Icon: (props: { className: string }) => JSX.Element;
  end?: boolean;
  userRole?: string[];
};

type NavigationGroup = {
  label: string;
  collapsible?: boolean;
  collapsed?: boolean;
  children: NavigationItemLink[];
};

type NavigationItem = NavigationItemLink | NavigationGroup | Divider;

type NavigationConfig = {
  items: NavigationItem[];
};

const NAVIGATION_CONFIG: NavigationConfig = {
  items: [
    {
      label: 'Dashboard',
      path: '/dashboard',
      Icon: () => {
        return <LayoutDashboard size={20} />;
      },
      end: true,
      userRole: ['admin', 'tutor', 'student'],
    },
    {
      label: 'Class Groups',
      path: '/classes',
      Icon: () => {
        return <FolderKanban size={20} />;
      },
      end: true,
      userRole: ['admin', 'tutor', 'student'],
    },
    {
      label: 'Tutors',
      path: '/tutors',
      Icon: () => {
        return <FolderKanban size={20} />;
      },
      end: true,
      userRole: ['admin'],
    },
    // {
    //   label: 'Students',
    //   path: '/students',
    //   Icon: ({ className }: { className: string }) => {
    //     return <Squares2X2Icon className={className} />;
    //   },
    //   end: true,
    //   userRole: ['admin', 'tutor'],
    // },
    {
      label: 'Upcoming Classes',
      path: '/upcoming-sessions',
      Icon: () => {
        return <CalendarClock size={20} />;
      },
      end: true,
      userRole: ['admin', 'tutor', 'student'],
    },
    {
      label: 'Past Classes',
      path: '/past-sessions',
      Icon: () => {
        return <CalendarCheck2 size={20} />;
      },
      end: true,
      userRole: ['admin', 'tutor', 'student'],
    },
    // {
    //   label: 'Sessions',
    //   path: '/sessions',
    //   Icon: ({ className }: { className: string }) => {
    //     return <Squares2X2Icon className={className} />;
    //   },
    //   end: true,
    //   userRole: ['admin', 'tutor', 'student'],
    // },
    {
      label: 'Payments',
      path: '/payments',
      Icon: () => {
        return <Wallet size={20} />;
      },
      end: true,
      userRole: ['admin', 'tutor', 'student'],
    },
    {
      label: 'Settings',
      collapsible: false,
      children: [
        {
          label: 'Profile',
          path: '/settings/profile',
          Icon: () => {
            return <User size={20} />;
          },
          userRole: ['admin', 'tutor', 'student'],
        },
        {
          label: 'Subscription',
          path: '/settings/subscription',
          Icon: () => {
            return <CreditCard size={20} />;
          },
          userRole: ['admin', 'tutor', 'student'],
        },
      ],
    },
  ],
};

export default NAVIGATION_CONFIG;
