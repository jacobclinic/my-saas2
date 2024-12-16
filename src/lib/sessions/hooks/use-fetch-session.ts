import useSupabase from '~/core/hooks/use-supabase';
import { getAllSessionsData, getAllSessionsByClassIdData } from '~/lib/sessions/database/queries';
import useSWR, { mutate } from 'swr';

function useSessionsDataQuery() {
  const client = useSupabase();
  const key = ['all-sessions'];

  const { data, error, isLoading } = useSWR(key, async () => {
    return getAllSessionsData(client).then((result) => result);
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

function useSessionsDataQueryRevalidate() {
  const key = ['all-sessions'];

  const revalidateSessionsDataFetch = () => {
    mutate(key);
  };

  return {
    revalidateSessionsDataFetch,
  };
}


function useSessionsDataByClassIdQuery( classId: string ) {
  const client = useSupabase();
  const key = [`all-sessions-by-${classId}`];

  const { data, error, isLoading } = useSWR(key, async () => {
    return getAllSessionsByClassIdData(client, classId).then((result) => result);
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

function useSessionsDataByClassIdQueryRevalidate( classId: string ) {
  const key = [`all-sessions-by-${classId}`];

  const revalidateSessionsByClassIdDataFetch = () => {
    mutate(key);
  };

  return {
    revalidateSessionsByClassIdDataFetch,
  };
}


export { 
  useSessionsDataQuery,
  useSessionsDataQueryRevalidate,
  useSessionsDataByClassIdQuery,
  useSessionsDataByClassIdQueryRevalidate,
};

export default useSessionsDataQuery;
