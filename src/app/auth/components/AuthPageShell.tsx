import Logo from '~/core/ui/Logo';

function AuthPageShell({ children }: React.PropsWithChildren) {
  return (
    <div
      className={
        'flex min-h-screen flex-col items-center justify-center space-y-4 p-12' +
        ' md:space-y-8 xl:space-y-16' +
        ' animate-in fade-in slide-in-from-top-8 duration-1000' + ' bg-gradient-to-br from-primary-800 via-primary-800 to-secondary-600 opacity-90'
      }
    >
      {/* <Logo /> */}

      <div
        className={`flex w-full max-w-2xl flex-col items-center space-y-4 lg:w-8/12 lg:px-6 xl:w-8/12 2xl:w-8/12`}
      >
        {children}
      </div>
    </div>
  );
}

export default AuthPageShell;
