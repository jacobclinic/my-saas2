// app/actions/registration-link.ts
'use server'

import { generateRegistrationToken } from '~/lib/registration-link';

export async function generateRegistrationLinkAction(registrationData: {
  classId: string;
  className: string;
  nextSession: string;
  time: string;
}) {
  const token = generateRegistrationToken(registrationData);
  return `${process.env.NEXT_PUBLIC_SITE_URL}/self-registration/${token}`;
}