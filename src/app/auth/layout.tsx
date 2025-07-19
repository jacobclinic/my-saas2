import loadAuthPageData from '~/lib/server/loaders/load-auth-page-data';
import AuthPageShell from '~/app/auth/components/AuthPageShell';

export const runtime = 'edge';

async function AuthLayout({ children }: React.PropsWithChildren) {
  await loadAuthPageData();

  return (
    <AuthPageShell>
      {children}
      <p className="text-xs sm:text-sm text-white mt-8">
        © 2025 Comma Education. All rights reserved.
      </p>
    </AuthPageShell>
  );
}

export default AuthLayout;
