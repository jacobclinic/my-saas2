import useSWRMutation from 'swr/mutation';
import { useRouter } from 'next/navigation';
import useSupabase from '~/core/hooks/use-supabase';
import { updateClass } from '~/lib/classes/database/mutations';
import type ClassType from '~/lib/classes/types/class';

function useUpdateClassMutation() {
  const client = useSupabase();
  const router = useRouter();
  const key = 'classes'; // You can customize the key to differentiate updates

  return useSWRMutation(
    key,
    async (_, { arg: { classId, classData } }: { arg: { classId: string; classData: Partial<ClassType> } }) => {
      console.log('Updating class data:', classData);
      return updateClass(client, classId, classData);
    },
    {
      onSuccess: () => {
        console.log('Class updated successfully');
        router.refresh(); // Refresh the page or take any action on success
      },
      onError: (error) => {
        console.error('Error updating class:', error);
      },
    },
  );
}

export default useUpdateClassMutation;