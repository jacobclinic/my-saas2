import useMutation from 'swr/mutation';

import type UserData from '~/core/session/types/user-data';
import { updateUserData } from '~/lib/user/database/mutations';
import useSupabase from '~/core/hooks/use-supabase';

type Payload = WithId<Partial<UserData>>;

/**
 * @name useUpdateProfile
 */
function useUpdateProfile() {
  const client = useSupabase();
  const key = 'useUpdateProfile';

  return useMutation(key, async (_, { arg: data }: { arg: Payload }) => {
    const { id, ...updateData } = data;
    return updateUserData(client, id, updateData);
  });
}

export default useUpdateProfile;
