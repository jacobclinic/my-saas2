import 'server-only';

import { cache } from 'react';
import { redirect } from 'next/navigation';

import configuration from '~/configuration';
import { USERS_TABLE } from '~/lib/db-tables';

import getSupabaseServerComponentClient from '~/core/supabase/server-component-client';
import verifyRequiresMfa from '~/core/session/utils/check-requires-mfa';

/**
 * @name loadAuthPageData
 * @description This function is responsible for loading the authentication
 * layout's data.
 * If the user is logged in and does not require multi-factor
 * authentication, check if they're a tutor who needs onboarding.
 * If they're a tutor without onboarding, keep them on auth pages.
 * Otherwise, redirect them to the app home page.
 */
const loadAuthPageData = cache(async () => {
  const client = getSupabaseServerComponentClient();

  const {
    data: { session },
  } = await client.auth.getSession();

  const requiresMultiFactorAuthentication = await verifyRequiresMfa(client);

  // If the user is logged in and does not require multi-factor authentication,
  // check if they need onboarding (for tutors) before redirecting.
  if (session && !requiresMultiFactorAuthentication) {
    const user = session.user;
    const userRole =
      user?.user_metadata['role'] ||
      user?.user_metadata['userRole'] ||
      user?.user_metadata['user_role'];

    // If user is a tutor, check if they've completed onboarding
    if (userRole === 'tutor') {
      try {
        const { data: userData, error: userError } = await client
          .from(USERS_TABLE)
          .select(
            'birthday, class_size, education_level, subjects_teach, user_role, identity_url, is_approved',
          )
          .eq('id', user.id)
          .single();

        // If we can't fetch user data, allow through to handle elsewhere
        if (userError) {
          console.log('Error fetching user data:', userError.message);
          console.log('Allowing through to auth pages');
          return {};
        }

        if (!userData) {
          console.log('No user data found, allowing through to auth pages');
          return {};
        }

        // Check if tutor has completed required onboarding fields
        const hasRequiredDetails =
          userData.birthday &&
          userData.class_size &&
          userData.education_level &&
          userData.subjects_teach &&
          userData.identity_url &&
          userData.birthday.trim() !== '' &&
          userData.identity_url.trim() !== '' &&
          userData.class_size.trim() !== '' &&
          userData.education_level.trim() !== '' &&
          userData.subjects_teach.length > 0;

        console.log('Has required details:', hasRequiredDetails);

        // If tutor hasn't completed onboarding, keep them on auth pages
        if (!hasRequiredDetails) {
          console.log(
            'Tutor has not completed onboarding, keeping on auth pages',
          );
          return {};
        }

        // If tutor has completed onboarding but is not approved, redirect to waiting page
        if (hasRequiredDetails && !userData.is_approved) {
          console.log(
            'Tutor completed onboarding but not approved, redirecting to waiting page',
          );
          redirect('/waiting');
        }

        // If tutor is approved, they can proceed to dashboard
        console.log('Tutor is approved, allowing redirect to dashboard');
      } catch (error) {
        // Check if this is a redirect error (which is expected)
        if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
          // This is a successful redirect, let it propagate
          throw error;
        }

        console.error('Error checking tutor onboarding status:', error);
        console.log('Allowing through to auth pages due to error');
        return {};
      }
    }

    // For non-tutors or tutors who have completed onboarding, redirect to dashboard
    console.log(
      `User is logged in and does not require multi-factor authentication. Redirecting to home page.`,
    );

    redirect(configuration.paths.appHome);
  }

  return {};
});

export default loadAuthPageData;
