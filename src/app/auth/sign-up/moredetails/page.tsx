import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import MoreDetailsForm from './components/MoreDetailsForm';
import getSupabaseServerComponentClient from '~/core/supabase/server-component-client';
import configuration from '~/configuration';

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

  // Get user info
  const { data: userData, error } = await client
    .from('users')
    .select(
      'display_name, first_name, last_name, phone_number, address, photo_url',
    )
    .eq('id', session.user.id)
    .single();

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
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-lg shadow-sm">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Complete Your Profile</h1>
          <p className="text-muted-foreground mt-2">
            Please provide some additional information to complete your profile.
          </p>
        </div>

        <MoreDetailsForm user={session.user} />
      </div>
    </div>
  );
}

export default MoreDetailsPage;
