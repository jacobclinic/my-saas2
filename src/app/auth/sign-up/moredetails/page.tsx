import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import getSupabaseServerComponentClient from '~/core/supabase/server-component-client';
import configuration from '~/configuration';
import { getUserByIdAction } from './actions';
import MoreDetailsForm from '../../components/MoreDetailsForm';
import Image from 'next/image';

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

  // Check for onboarding completion (the fields that MoreDetailsForm actually fills)
  const hasRequiredDetails =
    userData?.birthday &&
    userData?.class_size &&
    userData?.education_level &&
    userData?.subjects_teach &&
    userData?.identity_url &&
    userData?.birthday.trim() !== '' &&
    userData?.class_size.trim() !== '' &&
    userData?.education_level.trim() !== '' &&
    userData?.identity_url.trim() !== '' &&
    userData?.subjects_teach.length > 0;

  // If user has completed onboarding, redirect appropriately
  if (hasRequiredDetails) {
    // For tutors, check approval status
    if (userData.user_role === 'tutor') {
      if (!userData.is_approved) {
        redirect('/waiting');
      } else {
        redirect(searchParams.returnUrl || '/dashboard');
      }
    } else {
      // Non-tutors can go straight to dashboard
      redirect(searchParams.returnUrl || '/dashboard');
    }
  }

  return (
    <div className="flex w-full max-w-lg flex-col items-center space-y-4 rounded-xl border-transparent bg-white px-2 py-6 dark:bg-background dark:shadow-[0_0_1200px_0] dark:shadow-primary/30 md:w-8/12 md:border md:px-8 md:py-8 md:shadow-xl dark:md:border-dark-800 lg:px-6">
      <Image
        src="/assets/images/comaaas.png"
        alt="Logo"
        width={120}
        height={120}
        className="w-[95px] sm:w-[105px]"
      />
      <MoreDetailsForm user={session.user} returnUrl={searchParams.returnUrl} />
    </div>
  );
}

export default MoreDetailsPage;
