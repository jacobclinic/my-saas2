import { NextRequest, NextResponse } from 'next/server';
import { sendTutorApprovalOrRejectionEmail } from '~/lib/notifications/email/email.notification.service';
import { sendTutorApprovalSMS } from '~/lib/notifications/sms/sms.notification.service';

export async function POST(req: NextRequest) {
  try {
    // Validate that this is an internal request
    const authHeader = req.headers.get('Authorization');

    if (authHeader !== `Bearer ${process.env.INTERNAL_API_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { tutorName, email, phoneNumber, isApproved } = body;

    const promises = [
      sendTutorApprovalOrRejectionEmail(tutorName, email, isApproved),
    ];

    if (phoneNumber) {
      promises.push(sendTutorApprovalSMS(tutorName, phoneNumber, isApproved));
    }

    await Promise.all(promises);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in send-tutor-approval:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
