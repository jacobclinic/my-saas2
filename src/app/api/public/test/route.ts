import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import sendEmail from '~/core/email/send-email';
import getLogger from '~/core/logger';
import getSupabaseServerComponentClient from '~/core/supabase/server-component-client';
import { notifyUpcomingSessionsBefore24Hrs } from '~/lib/notifications/email/email.notification.service';
import { getAllUpcomingSessionsWithin24Hrs } from '~/lib/notifications/quieries';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!, {
      auth: {
        persistSession: false,
      },
    });
const logger = getLogger();

export async function GET(req: Request) {
  try {
    
    await notifyUpcomingSessionsBefore24Hrs();
    return NextResponse.json({ message: " successfully" }, { status: 200 });
  } catch (error) {
    logger.error('Error in GET /api/test:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
