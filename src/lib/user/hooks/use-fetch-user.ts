import useSupabase from '~/core/hooks/use-supabase';
import { getUserDataById } from '~/lib/user/database/queries';
import useSWR from 'swr';
function useUserDataQuery(
  userId: string
) {
  const client = useSupabase();
  const key = ['organization', userId];
  return useSWR(key, async () => {
    return getUserDataById(client, userId).then(
      (result) => result
    );
  });
}
export default useUserDataQuery;
