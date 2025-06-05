import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import useSupabase from '~/core/hooks/use-supabase';
import configuration from '~/configuration';

/**
 * @name useSignOut
 */
function useSignOut() {
  const client = useSupabase();
  const router = useRouter();

  return useCallback(async () => {
    await client.auth.signOut();
    router.push(configuration.paths.signIn);
  }, [client.auth, router]);
}

export default useSignOut;
