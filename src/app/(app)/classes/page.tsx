import AppHeader from '~/app/(app)/components/AppHeader';
import getSupabaseServerComponentClient from '~/core/supabase/server-component-client';
import { PageBody } from '~/core/ui/Page';
import {
  getAllClassesByStudentIdData,
  getAllClassesByTutorIdData,
  getAllClassesData,
  getAllClassesDataAdmin,
} from '~/lib/classes/database/queries';
import { redirect } from 'next/navigation';
import StudentClassClient from '../components/student-classes/StudentClassClient';
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
  // console.log('-----ClassesPage-------auth-User:', user);

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

  const userRole = userData?.user_role || 'admin';
  // const userRole = userData?.user_role || "student";

  let classesData: any[] = [];
  let studentClassesData: any[] = [];
  let tutorId;

  if (userRole === 'student') {
    studentClassesData = await getAllClassesByStudentIdData(
      client,
      user?.id || '',
    );
  } else if (userRole === 'tutor') {
    classesData = await getAllClassesByTutorIdData(client, user?.id || '');
    tutorId = user?.id;
  } else if (userRole === 'admin') {
    classesData = await getAllClassesDataAdmin(client);  
  }

  return (
    <>
      <AppHeader title={''} description={''} />

      <PageBody>
        {userRole === 'student' ? (
          <StudentClassClient studentClassesData={studentClassesData} />
        ) : userRole === 'tutor' ? (
          <ClassesListClient
            classesData={classesData}
            userRole={userRole}
            tutorId={tutorId}
          />
        ) : (
          // /////////////////////////////////////////////////
          <ClassesAdmin classesData={classesData} />
        )}
      </PageBody>
    </>
  );
}

export default ClassesPage;
