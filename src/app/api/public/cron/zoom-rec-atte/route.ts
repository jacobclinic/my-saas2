import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import getLogger from '~/core/logger';
import { markAttendanceAction } from '~/lib/attendance/server-actions';
import { syncZoomRecordings } from '~/lib/zoom/zoom-other.service';

const logger = getLogger();

export async function POST(req: Request) {
  // Validate request
  const authHeader = req.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const supabase = createClient(supabaseUrl!, supabaseKey!, {
    auth: {
      persistSession: false,
    },
  });

  try {
    // Run both operations in parallel using Promise.all
    const [attendanceResult, zoomResult] = await Promise.all([
      markAttendanceAction(supabase).catch((error) => {
        logger.error('Error in markAttendanceAction:', error);
        return null;
      }),
      syncZoomRecordings().catch((error) => {
        logger.error('Error in syncZoomRecordings:', error);
        throw error; // Re-throw this error as it's needed for the response
      }),
    ]);

    return NextResponse.json({ zoomResult, attendanceResult }, { status: 200 });
  } catch (error) {
    logger.error('Cron job failed:', error);
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 });
  }
}
