// pages/register/[token].tsx
import { ClassRegistrationData, verifyRegistrationToken } from '../../../../lib/registration-link';
import StudentRegistrationForm from '../../components/student-registration/RegistrationFormData';
import React from 'react';

export default function RegisterPage({ params }: { params: { token: string } }) {

  const classData = verifyRegistrationToken(params.token);

  if (!classData) {
    return <div>Loading...</div>;
  }

  return <StudentRegistrationForm classData={classData} />;
}