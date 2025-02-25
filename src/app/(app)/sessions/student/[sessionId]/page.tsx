import { useSearchParams } from 'next/navigation';
import getSupabaseServerComponentClient from '~/core/supabase/server-component-client';
import { PageBody } from '~/core/ui/Page';
import { getSessionByStudentIdData } from '~/lib/sessions/database/queries';
import { redirect } from 'next/navigation';
import StudentSessionDetails from '~/app/(app)/components/student-sessions/StudentSessionDetails';

interface Params {
  params: {
    sessionId: string;
  };
}

export default async function SessionViewPage({ params }: Params) {
  const client = getSupabaseServerComponentClient();

	// Get user and handle authentication
	const { data: { user }, error: authError } = await client.auth.getUser();

	console.log("--------------user----------------", user?.id, params.sessionId)

	// Handle authentication error
	if (authError || !user?.id) {
		console.error('Authentication error:', authError);
		redirect('/auth/sign-in');
	}

	const sessionData = await getSessionByStudentIdData(
    client,
    user.id,
    params.sessionId,
	)  

  if (!sessionData) {
    // Handle not found case
    return (
      <PageBody>
        <div className="text-center">
          <h1 className="text-2xl font-bold">Session not found</h1>
          <p className="mt-2 text-gray-600">The session you&apos;re looking for doesn&apos;t exist.</p>
        </div>
      </PageBody>
    );
  }

  // Determine session type based on start time
  const sessionType = new Date(sessionData.start_time|| "") > new Date() 
    ? 'upcoming' 
    : 'past';  

  return (
    <>
      {/* <AppHeader
        title={`${new Date(sessionData?.startTime || '').toLocaleString()} - ${sessionData?.class?.name}`}
        description={`Attendance - ${sessionData?.noOfAtendedStudents}, Status - ${sessionData?.status}`}
      /> */}

      <PageBody>
        <StudentSessionDetails 
					sessionData={sessionData}
					type={sessionType}
					studentId={user.id}
        />
      </PageBody>
    </>
  );
};