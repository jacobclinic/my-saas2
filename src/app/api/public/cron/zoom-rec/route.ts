import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import getLogger from '~/core/logger';
import {
  getRecordingDownloadUrl,
  downloadRecording,
} from '~/lib/zoom/zoom_rec.service';
import { uploadToS3 } from '~/lib/aws/s3.service';
import { updateRecordingUrl } from '~/lib/sessions/database/mutations';
import { getSessionsWithoutRecordingUrlsOfLast24hrs } from '~/lib/sessions/database/queries';
import getSupabaseServerActionClient from '~/core/supabase/action-client';

const logger = getLogger();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});
async function syncZoomRecordings() {
  try {
    logger.info('[Cron] Starting Zoom recording sync...');

    const sessions = await getSessionsWithoutRecordingUrlsOfLast24hrs(supabase);

    // Step 2: Process each session
    for (const session of sessions) {
      const zoomMeetingId = session.zoom_meeting_id;
      logger.info(`[Cron] Processing Zoom Meeting ID: ${zoomMeetingId}`);

      try {
        // Step 3: Get the download URL from Zoom
        const { downloadUrl, password } = await getRecordingDownloadUrl(zoomMeetingId!);
        logger.info(`[Cron] Retrieved download URL for Zoom Meeting ID ${zoomMeetingId}: ${downloadUrl}`);
        if (password) {
          logger.info(`[Cron] Recording is password-protected with passcode: ${password}`);
        }

        // Step 4: Download the recording
        const fileName = `${zoomMeetingId}-${Date.now()}.mp4`;
        const fileStream = await downloadRecording(downloadUrl, fileName);

        // Step 5: Upload to S3
        // const signedUrl = await uploadToS3(fileStream, fileName);

        // for testing purposes, we are using the downloadUrl as the signedUrl
        const signedUrl = downloadUrl;
        logger.info(`[Cron] Uploaded recording to S3 for Zoom Meeting ID ${zoomMeetingId}: ${signedUrl}`);

        // Step 6: Update the session with the S3 URL
        await updateRecordingUrl(supabase, zoomMeetingId!, signedUrl);
        logger.info(`[Cron] Updated recording URL for Zoom Meeting ID ${zoomMeetingId}`);
      } catch (error) {
        logger.error(`[Cron] Error processing Zoom Meeting ID ${zoomMeetingId}:`, error);
      }
    }
    

    logger.info('[Cron] Zoom recording sync completed.');
    return {
      message: 'Zoom recording sync completed',
      processed: sessions.length,
    };
  } catch (error) {
    logger.error('[Cron] Zoom recording sync failed:', error);
    throw error;
  }
}

export async function POST(req: Request) {

  // Validate request
  const authHeader = req.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const result = await syncZoomRecordings();
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    logger.error('Cron job failed:', error);
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 });
  }
}
