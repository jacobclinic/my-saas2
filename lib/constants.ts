// Theme colors and other constants
export const THEME = {
  colors: {
    primary: {
      blue: {
        50: '#EFF6FF',
        100: '#DBEAFE',
        200: '#BFDBFE',
        500: '#3B82F6',
        600: '#2563EB',
        700: '#1D4ED8',
        800: '#1E40AF',
        900: '#1E3A8A',
      },
      orange: {
        50: '#FFF7ED',
        100: '#FFEDD5',
        200: '#FED7AA',
        500: '#F97316',
        600: '#EA580C',
        700: '#C2410C',
        800: '#9A3412',
        900: '#7C2D12',
      },
    },
    success: {
      light: '#DCFCE7',
      DEFAULT: '#22C55E',
      dark: '#166534',
    },
    warning: {
      light: '#FEF3C7',
      DEFAULT: '#F59E0B',
      dark: '#B45309',
    },
    error: {
      light: '#FEE2E2',
      DEFAULT: '#EF4444',
      dark: '#B91C1C',
    },
    neutral: {
      50: '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      300: '#CBD5E1',
      400: '#94A3B8',
      500: '#64748B',
      600: '#475569',
      700: '#334155',
      800: '#1E293B',
      900: '#0F172A',
    },
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  borderRadius: {
    sm: '0.125rem',
    DEFAULT: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px',
  },
};

export const NAV_LINKS = [
  { name: 'Dashboard', href: '/', icon: 'LayoutDashboard' },
  { name: 'Class Groups', href: '/class-groups', icon: 'FolderKanban' },
  { name: 'Upcoming Classes', href: '/upcoming-classes', icon: 'CalendarClock' },
  { name: 'Past Classes', href: '/past-classes', icon: 'CalendarCheck2' },
  { name: 'Payments', href: '/payments', icon: 'Wallet' },
];

export const SETTINGS_LINKS = [
  { name: 'Profile', href: '/profile', icon: 'User' },
];