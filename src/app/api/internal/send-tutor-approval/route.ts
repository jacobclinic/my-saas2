import { NextRequest, NextResponse } from 'next/server';
import { sendTutorApprovalOrRejectionEmail } from '~/lib/notifications/email/email.notification.service';
import { sendTutorApprovalSMS } from '~/lib/notifications/sms/sms.notification.service';

export async function POST(req: NextRequest) {
  console.log('🔵 API DEBUG: send-tutor-approval API called');
  
  try {
    // Validate that this is an internal request
    const authHeader = req.headers.get('Authorization');
    console.log('🔵 API DEBUG: Authorization header present:', !!authHeader);
    
    if (authHeader !== `Bearer ${process.env.INTERNAL_API_SECRET}`) {
      console.error('❌ API DEBUG: Unauthorized request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    console.log('🔵 API DEBUG: Request body:', JSON.stringify(body, null, 2));
    
    const { tutorName, email, phoneNumber, isApproved } = body;
    
    console.log('🔵 API DEBUG: Processing approval notification');
    console.log('🔵 API DEBUG: tutorName:', tutorName);
    console.log('🔵 API DEBUG: email:', email);
    console.log('🔵 API DEBUG: phoneNumber:', phoneNumber);
    console.log('🔵 API DEBUG: phoneNumber type:', typeof phoneNumber);
    console.log('🔵 API DEBUG: isApproved:', isApproved);

    const promises = [
      sendTutorApprovalOrRejectionEmail(tutorName, email, isApproved),
    ];

    if (phoneNumber) {
      console.log('🔵 API DEBUG: phoneNumber provided, adding SMS to promises');
      promises.push(sendTutorApprovalSMS(tutorName, phoneNumber, isApproved));
    } else {
      console.log('🔵 API DEBUG: No phoneNumber provided, skipping SMS');
    }

    console.log('🔵 API DEBUG: Executing', promises.length, 'notification promises');
    await Promise.all(promises);
    console.log('✅ API DEBUG: All notifications sent successfully');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ API DEBUG: Error in send-tutor-approval:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
