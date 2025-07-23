/**
 * Utility functions for calling internal API routes for notifications
 */

export async function sendTutorRegistrationNotification(
  tutorName: string,
  email: string,
  phoneNumber?: string,
): Promise<void> {
  const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET;
  
  if (!INTERNAL_API_SECRET) {
    console.error('INTERNAL_API_SECRET not set. Cannot send notifications.');
    throw new Error('Internal API secret not configured');
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/internal/send-tutor-notification`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${INTERNAL_API_SECRET}`,
        },
        body: JSON.stringify({
          type: 'registration',
          tutorName,
          email,
          phoneNumber,
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to send tutor registration notification: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }
  } catch (error) {
    console.error('Error calling tutor registration notification API:', error);
    throw error;
  }
}

export async function sendTutorApprovalNotification(
  tutorName: string,
  email: string,
  isApproved: boolean,
  phoneNumber?: string,
): Promise<void> {
  const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET;
  
  if (!INTERNAL_API_SECRET) {
    console.error('INTERNAL_API_SECRET not set. Cannot send notifications.');
    throw new Error('Internal API secret not configured');
  }
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/internal/send-tutor-approval`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${INTERNAL_API_SECRET}`,
        },
        body: JSON.stringify({
          tutorName,
          email,
          phoneNumber,
          isApproved,
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to send tutor approval notification: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }
  } catch (error) {
    console.error('Error calling tutor approval notification API:', error);
    throw error;
  }
}
