// app/actions/registration-link.ts
'use server'

import { generateRegistrationToken } from '~/lib/registration-link';
import { createShortUrlAction } from '~/lib/short-links/server-actions-v2';

export async function generateRegistrationLinkAction(registrationData: {
  classId: string;
  className: string;
  nextSession: string;
  time: string;
  tutorName: string;
}) {
  const token = generateRegistrationToken(registrationData);
  const link = `${process.env.NEXT_PUBLIC_SITE_URL}/self-registration/${token}`;
  const shortLink = await createShortUrlAction({
    originalUrl: link,
    csrfToken: '', // CSRF token can be empty for server actions
  });
  if (shortLink.success && shortLink.shortUrl) {
    return shortLink.shortUrl;
  } else {
    return link; // Fallback to original link if short link creation fails
  }
}