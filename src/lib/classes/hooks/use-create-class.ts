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
      console.log('classData-1', classData);
      return createClass(client, classData);
    },
    {
      onSuccess: () => router.refresh(),
    },
  );
}

export default useCreateClassMutation;
