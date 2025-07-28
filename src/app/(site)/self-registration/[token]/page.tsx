// src/app/student-register/[token]/page.tsx
import {
  ClassRegistrationData,
  verifyRegistrationToken,
} from '../../../../lib/registration-link';
import React from 'react';
import { redirect } from 'next/navigation';

export default async function RegisterPage({
  params,
}: {
  params: { token: string };
}) {
  const classData = verifyRegistrationToken(params.token);

  if (!classData) {
    return <div>Invalid or expired registration token</div>;
  }

  // Redirect to new URL-based registration page
  const urlParams = new URLSearchParams({
    classId: classData.classId,
    className: classData.className,
    nextSession: classData.nextSession,
    time: classData.time,
    tutorName: classData.tutorName,
  });

  redirect(`/self-registration?${urlParams.toString()}`);
}
