import useSWRMutation from 'swr/mutation';
import { useRouter } from 'next/navigation';
import useSupabase from '~/core/hooks/use-supabase';
import { deleteClass } from '~/lib/classes/database/mutations';

function useDeleteClassMutation() {
  const client = useSupabase();
  const router = useRouter();
  const key = 'classes'; // You can customize the key as needed

  return useSWRMutation(
    key,
    async (_, { arg: classId }: { arg: string }) => {
      console.log('Deleting class with ID:', classId);
      return deleteClass(client, classId);
    },
    {
      onSuccess: () => {
        console.log('Class deleted successfully');
        router.refresh(); // Refresh the page or take any action on success
      },
      onError: (error) => {
        console.error('Error deleting class:', error);
      },
    },
  );
}

export default useDeleteClassMutation;