import getSupabaseServerComponentClient from '~/core/supabase/server-component-client';
import {
  getAllClassesByTutorIdData,
  getAllClassesDataAdmin,
} from '~/lib/classes/database/queries';
import { getUserDataById } from '~/lib/user/database/queries';
import { redirect } from 'next/navigation';
import ClassesListClient from '../components/classes/ClassesListClient';
import ClassesAdmin from '../components/admin/classes/ClassesAdmin';

export const metadata = {
  title: 'Sessions',
};

async function ClassesPage() {
  const client = getSupabaseServerComponentClient();
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();

  // Handle authentication error
  if (authError || !user?.id) {
    console.error('Authentication error:', authError);
    redirect('/auth/sign-in');
  }

  // Get user role
  const { data: userData, error: userError } = await client
    .from('users')
    .select('user_role')
    .eq('id', user.id)
    .single();

  if (userError) {
    throw userError;
  }

  const userRole = userData?.user_role;

  let classesData: any[] = [];
  let tutorId;
  let tutorProfile = null;

  if (userRole === 'tutor') {
    classesData = await getAllClassesByTutorIdData(client, user?.id || '');
    tutorId = user?.id;
    tutorProfile = await getUserDataById(client, user?.id || '');
  } else if (userRole === 'admin') {
    classesData = await getAllClassesDataAdmin(client);  
  }

  return (
    <>
      <div className='w-full h-full lg:pb-6 lg:pt-0 flex flex-col flex-1'>
        {userRole === 'tutor' ? (
          <ClassesListClient
            classesData={classesData}
            userRole={userRole}
            tutorId={tutorId}
            tutorProfile={tutorProfile}
          />
        ) : (
          <ClassesAdmin classesData={classesData} />
        )}
      </div>
    </>
  );
}

export default ClassesPage;
