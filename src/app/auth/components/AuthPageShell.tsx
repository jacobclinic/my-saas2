import Logo from '~/core/ui/Logo';

function AuthPageShell({ children }: React.PropsWithChildren) {
  return (
    <div
      className={
        'flex h-screen flex-col items-center justify-center space-y-4' +
        ' md:space-y-8 xl:space-y-16 lg:bg-gray-50 dark:lg:bg-background' +
        ' animate-in fade-in slide-in-from-top-8 duration-1000'
      }
    >
      <Logo />

      <div
        className={`flex w-full max-w-2xl flex-col items-center space-y-4 lg:w-8/12 lg:px-6 xl:w-8/12 2xl:w-8/12`}
      >
        {children}
      </div>
    </div>
  );
}

export default AuthPageShell;
