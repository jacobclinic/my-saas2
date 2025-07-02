import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import getSupabaseServerComponentClient from '~/core/supabase/server-component-client';
import configuration from '~/configuration';
import { getUserByIdAction } from './actions';
import MoreDetailsForm from '../../components/MoreDetailsForm';
import LogoImage from '~/core/ui/Logo/LogoImage';

export const metadata: Metadata = {
  title: 'Complete Your Profile',
  description: 'Provide additional information to complete your profile.',
};

async function MoreDetailsPage({
  searchParams,
}: {
  searchParams: { returnUrl?: string };
}) {
  // Get the current user
  const client = getSupabaseServerComponentClient();
  const {
    data: { session },
  } = await client.auth.getSession();

  // If not authenticated, redirect to sign-in
  if (!session) {
    redirect(configuration.paths.signIn);
  }

  const userData = await getUserByIdAction(session.user.id);

  // Only redirect if we have valid non-empty values for all required fields
  const hasRequiredDetails =
    userData?.first_name &&
    userData?.last_name &&
    userData?.phone_number &&
    userData?.first_name.trim() !== '' &&
    userData?.last_name.trim() !== '' &&
    userData?.phone_number.trim() !== '';

  if (hasRequiredDetails) {
    console.log('User already has required details, redirecting to dashboard');
    redirect(searchParams.returnUrl || '/dashboard');
  }

  return (
    <div className="flex w-full max-w-lg flex-col items-center space-y-4 rounded-xl border-transparent bg-white px-2 py-6 dark:bg-background dark:shadow-[0_0_1200px_0] dark:shadow-primary/30 md:w-8/12 md:border md:px-8 md:py-8 md:shadow-xl dark:md:border-dark-800 lg:px-6">
      <LogoImage className="mb-4" />
      <MoreDetailsForm user={session.user} returnUrl={searchParams.returnUrl} />
    </div>
  );
}

export default MoreDetailsPage;
