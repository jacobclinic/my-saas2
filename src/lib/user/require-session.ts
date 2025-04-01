import { redirect, useSearchParams } from 'next/navigation';
import type { SupabaseClient } from '@supabase/supabase-js';
import verifyRequiresMfa from '~/core/session/utils/check-requires-mfa';
import configuration from '~/configuration';
import { Database } from '~/database.types';
import { headers } from 'next/headers';

/**
 * @name requireSession
 * @description Require a session to be present in the request
 */
async function requireSession(
  client: SupabaseClient<Database>,
  params = {
    verifyFromServer: true,
  },
) {

  const headersList = headers();
  const requestUrl = headersList.get('x-request-url');
  
  const { data, error } = await client.auth.getSession();

  if (!data.session || error) {
    let redirectPath = configuration.paths.signIn;
    
    // Safely parse the current URL if it exists
    if (requestUrl) {
      try {
        const currentUrl = new URL(requestUrl);
        const existingRedirectUrl = currentUrl.searchParams.get('redirectUrl');
        
        // Use either the explicit redirectUrl or the current path + search
        const fallbackPath = `${currentUrl.pathname || ''}${currentUrl.search || ''}`;
        redirectPath = `${configuration.paths.signIn}?redirectUrl=${
          encodeURIComponent(existingRedirectUrl || fallbackPath)
        }`;
      } catch (e) {
        console.error('Error parsing URL:', e);
      }
    }

    return redirect(redirectPath);
  }

  const requiresMfa = await verifyRequiresMfa(client);

  // If the user requires multi-factor authentication,
  // redirect them to the page where they can verify their identity.
  if (requiresMfa) {
    return redirect(configuration.paths.signInMfa);
  }

  if (params.verifyFromServer) {
    const { data: user, error } = await client.auth.getUser();

    if (!user || error) {
      return redirect(configuration.paths.signIn);
    }
  }

  return data.session;
}

export default requireSession;
