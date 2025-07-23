import { NextRequest, NextResponse } from 'next/server';
import { sendTutorRegistrationEmail } from '~/lib/notifications/email/email.notification.service';
import { sendTutorRegistrationSMS } from '~/lib/notifications/sms/sms.notification.service';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req: NextRequest) {
  console.log('🔵 API DEBUG: send-tutor-notification API called');
  
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
    
    const { type, tutorName, email, phoneNumber } = body;

    if (type === 'registration') {
      console.log('🔵 API DEBUG: Processing registration notification');
      console.log('🔵 API DEBUG: tutorName:', tutorName);
      console.log('🔵 API DEBUG: email:', email);
      console.log('🔵 API DEBUG: phoneNumber:', phoneNumber);
      console.log('🔵 API DEBUG: phoneNumber type:', typeof phoneNumber);
      
      const promises = [sendTutorRegistrationEmail(tutorName, email)];

      if (phoneNumber) {
        console.log('🔵 API DEBUG: phoneNumber provided, adding SMS to promises');
        const supabase = createClient(supabaseUrl!, supabaseKey!);
        promises.push(
          sendTutorRegistrationSMS(supabase, tutorName, phoneNumber),
        );
      } else {
        console.log('🔵 API DEBUG: No phoneNumber provided, skipping SMS');
      }

      console.log('🔵 API DEBUG: Executing', promises.length, 'notification promises');
      await Promise.all(promises);
      console.log('✅ API DEBUG: All notifications sent successfully');

      return NextResponse.json({ success: true });
    }

    console.error('❌ API DEBUG: Invalid notification type:', type);
    return NextResponse.json(
      { error: 'Invalid notification type' },
      { status: 400 },
    );
  } catch (error) {
    console.error('❌ API DEBUG: Error in send-tutor-notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
