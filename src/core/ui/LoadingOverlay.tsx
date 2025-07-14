import type { PropsWithChildren } from 'react';
import classNames from 'clsx';

import LogoImage from '~/core/ui/Logo/LogoImage';
import If from '~/core/ui/If';
import Spinner from '~/core/ui/Spinner';
import Image from 'next/image';

export default function LoadingOverlay({
  children,
  className,
  fullPage = true,
  displayLogo = false,
}: PropsWithChildren<{
  className?: string;
  fullPage?: boolean;
  displayLogo?: boolean;
}>) {
  return (
    <div
      className={classNames(
        'flex flex-col items-center justify-center space-y-4',
        className,
        {
          [`fixed top-0 left-0 z-[100] h-screen w-screen bg-background`]:
            fullPage,
        },
      )}
    >
      <If condition={displayLogo}>
        <div className="flex w-full flex-col items-center pb-8">
          {' '}
          <Image
            src="/assets/images/comaaas.png"
            alt="Logo"
            width={120}
            height={120}
            className="w-[120px] sm:w-[140px]"
          />
        </div>
      </If>

      <Spinner className={'h-12 w-12'} style={{ color: '#1A3796' }} />

      <div>{children}</div>
    </div>
  );
}
