import type { NextRequest } from 'next/server';
import { redirect } from 'next/navigation';

import getLogger from '~/core/logger';
import configuration from '~/configuration';
import getSupabaseRouteHandlerClient from '~/core/supabase/route-handler-client';
import { getUserById } from '~/lib/user/database/queries';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const logger = getLogger();

  const authCode = requestUrl.searchParams.get('code');
  const returnUrl = requestUrl.searchParams.get('returnUrl');

  if (authCode) {
    const client = getSupabaseRouteHandlerClient();

    try {
      const { error } = await client.auth.exchangeCodeForSession(authCode);

      // if we have an error, we redirect to the error page
      if (error) {
        return onError({
          error: error.message,
        });
      }

      // After successful authentication, check if user needs to complete profile
      const {
        data: { user },
      } = await client.auth.getUser();

      if (user) {
        try {
          const userData = await getUserById(client, user.id);

          // Check if user has completed their profile
          const hasRequiredDetails =
            userData?.first_name &&
            userData?.last_name &&
            userData?.phone_number &&
            userData.first_name.trim() !== '' &&
            userData.last_name.trim() !== '' &&
            userData.phone_number.trim() !== '';

          if (!hasRequiredDetails) {
            // Redirect to complete profile page
            const moreDetailsUrl = new URL(
              '/auth/sign-up/moredetails',
              configuration.site.siteUrl,
            );
            if (returnUrl) {
              moreDetailsUrl.searchParams.set('returnUrl', returnUrl);
            }
            return redirect(moreDetailsUrl.toString());
          }
        } catch (userError) {
          // If user data doesn't exist, they need to complete profile
          const moreDetailsUrl = new URL(
            '/auth/sign-up/moredetails',
            configuration.site.siteUrl,
          );
          if (returnUrl) {
            moreDetailsUrl.searchParams.set('returnUrl', returnUrl);
          }
          return redirect(moreDetailsUrl.toString());
        }
      }
    } catch (error) {
      logger.error(
        {
          error,
        },
        `An error occurred while exchanging code for session`,
      );

      const message = error instanceof Error ? error.message : error;

      return onError({
        error: message as string,
      });
    }
  }

  // If user has completed profile, redirect to the intended destination
  const finalRedirectUrl = returnUrl || configuration.paths.appHome;
  return redirect(finalRedirectUrl);
}

function onError({ error }: { error: string }) {
  const errorMessage = getAuthErrorMessage(error);

  getLogger().error(
    {
      error,
    },
    `An error occurred while signing user in`,
  );

  redirect(`/auth/callback/error?error=${errorMessage}`);
}

/**
 * Checks if the given error message indicates a verifier error.
 * We check for this specific error because it's highly likely that the
 * user is trying to sign in using a different browser than the one they
 * used to request the sign in link. This is a common mistake, so we
 * want to provide a helpful error message.
 */
function isVerifierError(error: string) {
  return error.includes('both auth code and code verifier should be non-empty');
}

function getAuthErrorMessage(error: string) {
  return isVerifierError(error)
    ? getCodeVerifierMessageError()
    : getGenericErrorMessage();
}

function getCodeVerifierMessageError() {
  return `It looks like you're trying to sign in using a different browser than the one you used to request the sign in link. Please try again using the same browser.`;
}

function getGenericErrorMessage() {
  return `Sorry, we could not authenticate you. Please try again.`;
}
