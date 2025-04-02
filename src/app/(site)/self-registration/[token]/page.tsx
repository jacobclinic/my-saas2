// src/app/student-register/[token]/page.tsx
import { ClassRegistrationData, verifyRegistrationToken } from '../../../../lib/registration-link';
import StudentRegistrationForm from '../../../(app)/components/student-registration/RegistrationFormData';
import React from 'react';
import { getNextSessionByClassID } from '~/lib/sessions/database/queries';
import getSupabaseServerComponentClient from '~/core/supabase/server-component-client';

export default async function RegisterPage({ params }: { params: { token: string } }) {

  const client = getSupabaseServerComponentClient();
  const classData = verifyRegistrationToken(params.token);
  let sessionData = await getNextSessionByClassID(client, classData?.classId || '');

  if (!classData) {
    return <div>Loading...</div>;
  }

  return <StudentRegistrationForm classData={classData} nextSessionData={sessionData!}/>;
}