'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  ComputerDesktopIcon,
  SunIcon,
  MoonIcon,
} from '@heroicons/react/24/outline';

import {
  setTheme,
  getStoredTheme,
  isDarkSystemTheme,
  DARK_THEME_CLASSNAME,
  LIGHT_THEME_CLASSNAME,
  SYSTEM_THEME_CLASSNAME,
} from '~/core/theming';

import IconButton from '~/core/ui/IconButton';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/core/ui/Select';

import ClientOnly from '~/core/ui/ClientOnly';

const DarkModeToggle = () => {
  const defaultTheme = useMemo(getStoredTheme, []);
  const [currentTheme, setCurrentTheme] = useState<string>(defaultTheme);
  const isDarkTheme = currentTheme === DARK_THEME_CLASSNAME;
  const isSystemTheme = currentTheme === SYSTEM_THEME_CLASSNAME;

  const Icon = useMemo(() => {
    const shouldUseSystemDarkTheme = isSystemTheme && isDarkSystemTheme();

    if (isDarkTheme || shouldUseSystemDarkTheme) {
      return <MoonIcon className={'h-4'} />;
    }

    return <SunIcon className={'h-4'} />;
  }, [isSystemTheme, isDarkTheme]);

  useEffect(() => {
    setTheme(currentTheme);
  }, [currentTheme]);

  return (
    <Select value={currentTheme} onValueChange={setCurrentTheme}>
      <SelectTrigger asChild>
        <IconButton
          type={'button'}
          data-cy={'dark-mode-toggle'}
          className={
            'flex items-center !rounded-full !border-transparent shadow-sm' +
            ' transition-shadow !bg-transparent' +
            ' dark:hover:shadow-primary-500 dark:shadow-lg'
          }
        >
          <span hidden>
            <SelectValue />
          </span>

          <ClientOnly>{Icon}</ClientOnly>
        </IconButton>
      </SelectTrigger>

      <SelectContent position={'popper'} sideOffset={5}>
        <SelectItem
          data-cy={'light-theme-button'}
          value={LIGHT_THEME_CLASSNAME}
        >
          <span className={'flex items-center space-x-2.5'}>
            <SunIcon className={'h-4'} />

            <span>Light</span>
          </span>
        </SelectItem>

        <SelectItem data-cy={'dark-theme-button'} value={DARK_THEME_CLASSNAME}>
          <span className={'flex items-center space-x-2.5'}>
            <MoonIcon className={'h-4'} />

            <span>Dark</span>
          </span>
        </SelectItem>

        <SelectItem
          data-cy={'system-theme-button'}
          value={SYSTEM_THEME_CLASSNAME}
        >
          <span className={'flex items-center space-x-2.5'}>
            <ComputerDesktopIcon className={'h-4'} />

            <span>System</span>
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  );
};

export default DarkModeToggle;
