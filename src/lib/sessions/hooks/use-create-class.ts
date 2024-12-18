// import useSupabase from '~/core/hooks/use-supabase';
// import { getUserDataById } from '~/lib/user/database/queries';
// import useSWR from 'swr';
// function useUserDataQuery(
//   userId: string
// ) {
//   const client = useSupabase();
//   const key = ['organization', userId];
//   return useSWR(key, async () => {
//     return getUserDataById(client, userId).then(
//       (result) => result
//     );
//   });
// }
// export default useUserDataQuery;


import useSWRMutation from 'swr/mutation';
import { useRouter } from 'next/navigation';
import useSupabase from '~/core/hooks/use-supabase';
import { createClass } from '~/lib/classes/database/mutations';
import type ClassType from '~/lib/classes/types/class';

function useCreateClassMutation() {
  const client = useSupabase();
  const router = useRouter();
  const key = 'classes';
  return useSWRMutation(
    key,
    async (_, { arg: classData }: { arg: Omit<ClassType, 'id'> }) => {
        console.log("classData-1",classData);
      return createClass(client, classData);
    },
    {
      onSuccess: () => router.refresh(),
    },
  );
}

export default useCreateClassMutation;