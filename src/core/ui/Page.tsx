import classNames from 'clsx';
import Heading from '~/core/ui/Heading';

export function Page(
  props: React.PropsWithChildren<{
    sidebar?: React.ReactNode;
  }>,
) {
  return (
    <div className={'flex overflow-hidden'}>
      <div className={'hidden lg:block'}>{props.sidebar}</div>

      <div
        className={
          'relative mx-auto flex flex-col h-screen w-full overflow-y-auto'
        }
      >
        {props.children}
      </div>
    </div>
  );
}

export function PageBody(
  props: React.PropsWithChildren<{
    className?: string;
  }>,
) {
  const className = classNames(
    'w-full h-full px-4 lg:p-6 flex flex-col flex-1',
    props.className,
  );

  return <div className={className}>{props.children}</div>;
}

export function PageHeader({
  children,
  title,
  description,
  mobileNavigation,
}: React.PropsWithChildren<{
  title: string | React.ReactNode;
  description?: string | React.ReactNode;
  mobileNavigation?: React.ReactNode;
}>) {
  return (
    <div className={'flex justify-between p-6 border-b border-neutral-200 gap-1 lg:gap-2 flex-col lg:flex-row items-end lg:items-center'}>
      <div
        className={
          'w-full flex lg:flex-col items-center lg:items-stretch justify-between lg:justify-normal space-x-2 lg:space-x-0'
        }
      >
        <div className={'flex items-center lg:hidden'}>{mobileNavigation}</div>

        <Heading type={3}>
          <span className={'flex items-center space-x-0.5 lg:space-x-2'}>
            <span className={'text-xl sm:text-2xl font-bold text-neutral-900'}>{title}</span>
          </span>
        </Heading>

        <Heading type={5} className={'hidden lg:block'}>
          <span className={'dark:text-gray-400 text-gray-600 font-normal'}>
            {description}
          </span>
        </Heading>
      </div>

      {children}
    </div>
  );
}
