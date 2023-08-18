import { cache } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import getSupabaseServerClient from '~/core/supabase/server-client';
import GlobalRole from '~/core/session/types/global-role';

/**
 * @name isUserSuperAdmin
 * @description Checks if the current user is an admin by checking the
 * user_metadata.admin field in Supabase Auth is set to true.
 */
const isUserSuperAdmin = cache(
  async (
    params: {
      enforceMfa?: boolean;
    } = {
      enforceMfa: false,
    },
  ) => {
    try {
      const client = getSupabaseServerClient();
      const { data, error } = await client.auth.getUser();

      if (error) {
        return false;
      }

      // If we enforce MFA, we need to check that the user is MFA authenticated.
      if (params.enforceMfa) {
        const isMfaAuthenticated =
          await verifyIsMultiFactorAuthenticated(client);

        if (!isMfaAuthenticated) {
          return false;
        }
      }

      const adminMetadata = data.user?.user_metadata;
      const role = adminMetadata?.role;

      return role === GlobalRole.SuperAdmin;
    } catch (e) {
      return false;
    }
  },
);

export default isUserSuperAdmin;

async function verifyIsMultiFactorAuthenticated(client: SupabaseClient) {
  const { data, error } =
    await client.auth.mfa.getAuthenticatorAssuranceLevel();

  if (error || !data) {
    return false;
  }

  return data.currentLevel === 'aal2';
}
