import type { SupabaseClient } from '@supabase/supabase-js';
import getLogger from '~/core/logger';
const logger = getLogger()

const ASSURANCE_LEVEL_2 = 'aal2';

/**
 * @name checkSessionRequiresMultiFactorAuthentication
 * @description Checks if the current session requires multi-factor authentication.
 * We do it by checking that the next assurance level is AAL2 and that the current assurance level is not AAL2.
 * @param client
 */
async function checkSessionRequiresMultiFactorAuthentication(
  client: SupabaseClient
) {
  try {
    const assuranceLevel = await client.auth.mfa.getAuthenticatorAssuranceLevel();

    if (assuranceLevel.error) {
      logger.error('MFA check error:', assuranceLevel.error);
      throw new Error(assuranceLevel.error.message);
    }

    const { nextLevel, currentLevel } = assuranceLevel.data;

    return nextLevel === ASSURANCE_LEVEL_2 && nextLevel !== currentLevel;
  } catch (error) {
    logger.error('MFA check error (expected for unauthenticated users):', error);
    return false;
  }
}

export default checkSessionRequiresMultiFactorAuthentication;
