import AppHeader from '~/app/(app)/components/AppHeader';
import getSupabaseServerComponentClient from '~/core/supabase/server-component-client';
import { PageBody } from '~/core/ui/Page';
import ClassesList from '../components/classes/ClassesList';
import { getAllClassesByTutorIdData } from '~/lib/classes/database/queries';
import { redirect } from 'next/navigation';
import StudentRegistrationForm from '../components/student-registration/RegistrationFormData';
import RegistrationSuccess from '../components/student-registration/RegistrationSuccess';

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


  const classesData = await getAllClassesByTutorIdData(client, user?.id || "");
  console.log("Classes-server-component------", classesData);
  
  return (
    <>
      <AppHeader
        title={''}
        description={
          ""
        }
      />

      <PageBody>
        {userRole !== 'student' ? <ClassesList classesData={classesData} userRole={userRole}/> : 
        // <StudentRegistrationForm />
        <RegistrationSuccess
          studentDetails = {{
            username: 'Kalum',
            password: 'password',
            email: 'kalum@gmail.com',
            nextClass: {
              date: '2023-12-12',
              time: '10:00 AM',
              zoomLink: 'https://zoom.us/j/1234567890',
            },
            materials: [
              {
                name: 'Class 1 Material',
                link: 'https://example.com/material1',
              },
              {
                name: 'Class 2 Material',
                link: 'https://example.com/material2',
              }
            ]
          }}
        />

        }
      </PageBody>
    </>
  );
}

export default ClassesPage;
