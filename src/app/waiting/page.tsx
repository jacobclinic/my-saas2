import { redirect } from 'next/navigation';
import getSupabaseServerComponentClient from '~/core/supabase/server-component-client';
import { USERS_TABLE } from '~/lib/db-tables';
import configuration from '~/configuration';
import WaitingPageComponent from './components/WaitingPageComponent';

export default async function WaitingPage() {
  const client = getSupabaseServerComponentClient();

  // Check if user is authenticated
  const {
    data: { session },
  } = await client.auth.getSession();

  if (!session?.user) {
    redirect(configuration.paths.signIn);
  }

  // Get user data to check approval status
  const { data: userData, error } = await client
    .from(USERS_TABLE)
    .select('is_approved, user_role, email')
    .eq('id', session.user.id)
    .single();

  // If user is already approved, redirect to dashboard
  if (!error && userData?.is_approved) {
    redirect(configuration.paths.appHome);
  }

  // If user is not a tutor, redirect to dashboard (they don't need approval)
  if (!error && userData?.user_role !== 'tutor') {
    redirect(configuration.paths.appHome);
  }

  return (
    <WaitingPageComponent
      userEmail={userData?.email || session.user.email || ''}
    />
  );
}
