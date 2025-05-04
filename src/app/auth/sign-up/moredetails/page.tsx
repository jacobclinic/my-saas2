import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import getSupabaseServerComponentClient from '~/core/supabase/server-component-client';
import configuration from '~/configuration';
import { getUserByIdAction } from './actions';
import MoreDetailsForm from '../../components/MoreDetailsForm';

export const metadata: Metadata = {
  title: 'Complete Your Profile',
  description: 'Provide additional information to complete your profile.',
};

async function MoreDetailsPage() {
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

  console.log('User data on moredetails page:', userData);

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
    redirect('/dashboard');
  }

  return (
    <div className="min-h-[100%] max-h-screen flex items-center justify-center py-1 px-4 sm:px-6 lg:px-4 bg-background md:border md:px-8 md:py-2 md:shadow-xl dark:md:border-dark-800  dark:bg-background dark:shadow-[0_0_1200px_0] dark:shadow-primary/30 bg-white">
        <MoreDetailsForm user={session.user} />
    </div>
  );
}

export default MoreDetailsPage;
