import useSupabase from '~/core/hooks/use-supabase';
import { getAllClassesData, getClassDataById } from '~/lib/classes/database/queries';
import useSWR, { mutate } from 'swr';

function useClassesDataQuery() {
  const client = useSupabase();
  const key = ['all-classes'];

  const { data, error, isLoading } = useSWR(key, async () => {
    return getAllClassesData(client).then((result) => result);
  });

  const revalidate = () => {
    mutate(key);
  };

  return {
    data,
    error,
    isLoading,
    revalidate,
  };
}

function useClassesDataQueryRevalidate() {
  const key = ['all-classes'];

  const revalidateClassesDataFetch = () => {
    mutate(key);
  };

  return {
    revalidateClassesDataFetch,
  };
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

export { useClassesDataQuery, useClassesDataQueryRevalidate, useClassByIdQuery };

export default useClassesDataQuery;
