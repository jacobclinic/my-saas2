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
        className={`flex w-full max-w-md flex-col items-center space-y-4 rounded-xl border-transparent bg-white px-2 py-1 dark:bg-background dark:shadow-[0_0_1200px_0] dark:shadow-primary/30 md:w-8/12 md:border md:px-8 md:py-6 md:shadow-xl dark:md:border-dark-800 lg:w-5/12 lg:px-6 xl:w-4/12 2xl:w-3/12`}
      >
        {children}
      </div>
    </div>
  );
}

export default AuthPageShell;
