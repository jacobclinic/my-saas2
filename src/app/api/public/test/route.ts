import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import getLogger from '~/core/logger';
import { notifyUpcomingSessionsBefore24Hrs } from '~/lib/notifications/email/email.notification.service';


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
    

    return NextResponse.json({ message: " successfully" }, { status: 200 });
  } catch (error) {
    logger.error('Error in GET /api/test:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}