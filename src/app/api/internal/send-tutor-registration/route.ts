import { NextRequest, NextResponse } from 'next/server';
import { sendTutorRegistrationEmail } from '~/lib/notifications/email/email.notification.service';
import { sendTutorRegistrationSMS } from '~/lib/notifications/sms/sms.notification.service';

export async function POST(req: NextRequest) {
  try {
    // Validate that this is an internal request
    const authHeader = req.headers.get('Authorization');

    if (authHeader !== `Bearer ${process.env.INTERNAL_API_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { type, tutorName, email, phoneNumber } = body;

    if (type === 'registration') {
      const promises = [sendTutorRegistrationEmail(tutorName, email)];

      if (phoneNumber) {
        promises.push(
          sendTutorRegistrationSMS(tutorName, phoneNumber),
        );
      }

      await Promise.all(promises);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Invalid notification type' },
      { status: 400 },
    );
  } catch (error) {
    console.error('Error in send-tutor-notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
