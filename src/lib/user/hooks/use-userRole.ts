import useSWR from 'swr';
import useSupabase from '~/core/hooks/use-supabase';
import { USERS_TABLE } from '~/lib/db-tables';
import useUserId from '~/core/hooks/use-user-id';
import { fetchUserRole } from '../database/queries';

/**
 * @name useUserRole
 * @description Fetches the role of the currently authenticated user.
 */
function useUserRole() {
  const client = useSupabase();
  const authUserId = useUserId();
  const key = authUserId ? ['userRole', authUserId] : null;

  const fetcher = () => fetchUserRole(client, authUserId!);

  return useSWR(key, fetcher);
}

export default useUserRole;
