import useSupabase from '~/core/hooks/use-supabase';
import { getAllClassesData, getClassDataById } from '~/lib/classes/database/queries';
import useSWR from 'swr';

function useClassDataQuery() {
  const client = useSupabase();
  const key = ['all-classes'];
  return useSWR(key, async () => {
    return getAllClassesData(client).then(
      (result) => result
    );
  });
}

function useClassByIdQuery(classId: string | null) {
  const client = useSupabase();

  return useSWR(
    classId ? ['class-data', classId] : null, // Use null if classId is not provided to skip the query
    async () => {
      if (!classId) {
        throw new Error('Class ID is required to fetch class data.');
      }
      return getClassDataById(client, classId).then(
        (result) => result
      );
    },
  );
}

export { useClassDataQuery, useClassByIdQuery };

export default useClassDataQuery;
