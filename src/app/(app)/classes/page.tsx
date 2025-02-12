import AppHeader from '~/app/(app)/components/AppHeader';
import getSupabaseServerComponentClient from '~/core/supabase/server-component-client';
import { PageBody } from '~/core/ui/Page';
import ClassesList from '../components/classes/ClassesList';
import { getAllClassesByStudentIdData, getAllClassesByTutorIdData } from '~/lib/classes/database/queries';
import { redirect } from 'next/navigation';
import StudentRegistrationForm from '../components/student-registration/RegistrationFormData';
import RegistrationSuccess from '../components/student-registration/RegistrationSuccess';
import StudentClassList from '../components/student-classes/StudentClassList';

export const metadata = {
  title: 'Sessions',
};

async function ClassesPage() {
  const client = getSupabaseServerComponentClient();
  const { data: { user }, error: authError } = await client.auth.getUser();
  console.log('-----ClassesPage-------auth-User:', user);

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

  const userRole = userData?.user_role || "admin";
  // const userRole = userData?.user_role || "student";

  let classesData: any[] = [];
  let studentClassesData: any[] = [];

  if (userRole === "student") {
    studentClassesData = await getAllClassesByStudentIdData(client, user?.id || "");
    console.log("Classes-server-component------", studentClassesData);
  } else if (userRole === "tutor") {
    classesData = await getAllClassesByTutorIdData(client, user?.id || ""); 
    console.log("Classes-server-component------", classesData);
  }
  
  return (
    <>
      <AppHeader
        title={''}
        description={
          ""
        }
      />

      <PageBody>
        {userRole === 'student' ? (
          <StudentClassList studentClassesData={studentClassesData} />
        ) : (
          <ClassesList classesData={classesData} userRole={userRole}/>
        )}
      </PageBody>
    </>
  );
}

export default ClassesPage;
