'use client';

import { ChevronRightIcon } from '@heroicons/react/24/outline';

import Logo from '~/core/ui/Logo';
import Container from '~/core/ui/Container';
import If from '~/core/ui/If';
import Button from '~/core/ui/Button';
import SiteNavigation from './SiteNavigation';
import useSignOut from '~/core/hooks/use-sign-out';
import useUserSession from '~/core/hooks/use-user-session';

import DarkModeToggle from '~/components/DarkModeToggle';
import ProfileDropdown from '~/components/ProfileDropdown';

import configuration from '~/configuration';

const SiteHeader: React.FCC = () => {
  const signOut = useSignOut();
  const userSession = useUserSession();

  return (
    <Container>
      <div className="flex py-1.5 px-1 items-center border-b border-gray-50 dark:border-dark-800/50 justify-between">
        <div className={'w-4/12'}>
          <Logo />
        </div>

        {/* <div className={'w-4/12 hidden lg:flex justify-center'}>
          <SiteNavigation />
        </div> */}

        <div className={'flex flex-1 items-center justify-end space-x-4'}>
          <div className={'items-center flex'}>
            <If condition={configuration.features.enableThemeSwitcher}>
              <DarkModeToggle />
            </If>
          </div>

          <If condition={userSession} fallback={<AuthButtons />}>
            {(session) => (
              <ProfileDropdown
                displayName={false}
                userSession={session}
                signOutRequested={signOut}
              />
            )}
          </If>

          <div className={'flex lg:hidden'}>
            <SiteNavigation />
          </div>
        </div>
      </div>
    </Container>
  );
};

function AuthButtons() {
  return (
    <div className={'hidden space-x-2 lg:flex'}>
      <Button round variant={'ghost'} href={configuration.paths.signIn}>
        <span>Sign In</span>
      </Button>

      <Button round href={configuration.paths.signUp}>
        <span className={'flex items-center space-x-2'}>
          <span>Sign Up</span>
          <ChevronRightIcon className={'h-4'} />
        </span>
      </Button>
    </div>
  );
}

export default SiteHeader;
