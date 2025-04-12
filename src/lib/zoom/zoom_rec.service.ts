import fetch from 'node-fetch';
import { uploadToS3 } from '~/lib/aws/s3.service'; // Import S3 upload function
import {
  ZoomRecordingResponse,
  ZoomTokenResponse,
  ZoomUserRecordingsResponse,
} from './types/zoom.types';
import getLogger from '~/core/logger';
import { createClient } from '@supabase/supabase-js';
import { updateRecordingUrl } from '../sessions/database/mutations';

const logger = getLogger();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SESSIONS_TABLE = 'sessions';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

// Fetch Server-to-Server OAuth access token
async function getZoomAccessToken(): Promise<string> {
  const response = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${process.env.ZOOM_ACCOUNT_ID}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`).toString('base64')}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to get access token: ${response.statusText}`);
  }

  const data = (await response.json()) as ZoomTokenResponse; // Type the response
  return data.access_token;
}

// Delete a specific recording file from Zoom cloud
export async function deleteRecordingFile(
  meetingId: string,
  recordingId: string,
): Promise<void> {
  const accessToken = await getZoomAccessToken();
  const url = `https://api.zoom.us/v2/meetings/${meetingId}/recordings/${recordingId}`;
  logger.info(
    `[Zoom] Deleting recording file ${recordingId} for meeting ${meetingId}`,
  );

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error(
      `[Zoom] Failed to delete recording file ${recordingId} for meeting ${meetingId}: ${errorText}`,
    );
    throw new Error(`Failed to delete recording file: ${response.statusText}`);
  }

  logger.info(
    `[Zoom] Successfully deleted recording file ${recordingId} for meeting ${meetingId}`,
  );
}

// Download a recording file as a stream
export async function downloadRecording(
  downloadUrl: string,
  fileName: string,
): Promise<NodeJS.ReadableStream> {
  const accessToken = await getZoomAccessToken();
  const fullUrl = `${downloadUrl}?access_token=${accessToken}`;
  logger.info(`[Zoom] Downloading recording from: ${fullUrl}`);

  const response = await fetch(fullUrl, {
    method: 'GET',
    redirect: 'follow',
  });

  if (!response.ok) {
    logger.error(
      `[Zoom] Failed to download recording: ${response.status} - ${response.statusText}`,
    );
    throw new Error(`Failed to download: ${response.statusText}`);
  }

  logger.info('[Zoom] Recording downloaded successfully');
  return response.body as NodeJS.ReadableStream;
}

// Fetch all recordings for a user within a date range, handling pagination
export async function getAllRecordings(
  from: string,
  to: string,
  pageSize = 30,
): Promise<ZoomUserRecordingsResponse['meetings']> {
  const accessToken = await getZoomAccessToken();
  let allMeetings: ZoomUserRecordingsResponse['meetings'] = [];
  let nextPageToken = '';
  let pageNumber = 1;

  do {
    const url = `https://api.zoom.us/v2/users/me/recordings?from=${from}&to=${to}&page_size=${pageSize}${nextPageToken ? `&next_page_token=${nextPageToken}` : ''}`;
    logger.info(`[Zoom] Fetching recordings page ${pageNumber}: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      logger.error(`[Zoom] Failed to fetch recordings: ${response.statusText}`);
      throw new Error(`Failed to fetch recordings: ${response.statusText}`);
    }

    const data = (await response.json()) as ZoomUserRecordingsResponse;
    allMeetings = allMeetings.concat(data.meetings);
    nextPageToken = data.next_page_token || '';
    pageNumber++;
  } while (nextPageToken);

  logger.info(`[Zoom] Fetched ${allMeetings.length} meetings with recordings.`);
  return allMeetings;
}

export async function syncZoomRecordings() {
  try {
    logger.info('[Cron] Starting Zoom recording sync...');

    // Step 1: Calculate the date range (past 24 hours)
    const now = new Date();
    const twentyFourHoursAgo = new Date(
      now.getTime() - 30 * 24 * 60 * 60 * 1000,
    );
    const from = twentyFourHoursAgo.toISOString().split('T')[0]; // e.g., "2025-04-06"
    const to = now.toISOString().split('T')[0]; // e.g., "2025-04-07"

    // Step 2: Fetch all recordings from Zoom
    const meetings = await getAllRecordings(from, to);
    if (!meetings || meetings.length === 0) {
      logger.info('[Cron] No recordings found in Zoom for the past 24 hours.');
      return { message: 'No recordings to process' };
    }

    logger.info(`[Cron] Found ${meetings.length} meetings with recordings.`);

    // Step 3: Process each meeting
    let processedMeetings = 0;
    for (const meeting of meetings) {
      const zoomMeetingId = meeting.id.toString();
      logger.info(`[Cron] Processing Zoom Meeting ID: ${zoomMeetingId}`);

      // Step 4: Check if the meeting exists in the sessions table
      const { data: session, error: fetchError } = await supabase
        .from(SESSIONS_TABLE)
        .select('id')
        .eq('zoom_meeting_id', zoomMeetingId)
        .single();

      if (fetchError || !session) {
        logger.warn(
          `[Cron] No session found for Zoom Meeting ID ${zoomMeetingId}, skipping.`,
        );
        continue;
      }

      // Step 5: Process each recording file for the meeting
      const recordingFiles = meeting.recording_files || [];
      if (recordingFiles.length === 0) {
        logger.info(
          `[Cron] No recording files found for Zoom Meeting ID ${zoomMeetingId}, skipping.`,
        );
        continue;
      }

      for (const file of recordingFiles) {
        if (file.status !== 'completed') {
          logger.info(
            `[Cron] Recording file ${file.id} for Zoom Meeting ID ${zoomMeetingId} is not completed, skipping.`,
          );
          continue;
        }

        try {
          // Step 6: Download the recording file
          const fileExtension =
            file.file_type.toLowerCase() === 'mp4'
              ? 'mp4'
              : file.file_type.toLowerCase() === 'm4a'
                ? 'm4a'
                : 'unknown';
          if (fileExtension === 'mp4' || fileExtension === 'm4a') {
            const fileName = `${zoomMeetingId}-${file.id}.${fileExtension}`;
            const fileStream = await downloadRecording(
              file.download_url,
              fileName,
            );

            // for testing
            //  const signedUrl = file.download_url; // Replace with actual signed URL from S3 upload
            // Step 7: Upload to S3
            await uploadToS3(fileStream, fileName);
            logger.info(
              `[Cron] Uploaded recording file ${file.id} to S3 for Zoom Meeting ID ${zoomMeetingId}`,
            );

            // Step 8: Update the session with the S3 URL
            await updateRecordingUrl(supabase, zoomMeetingId, fileName);
            logger.info(
              `[Cron] Updated recording URL for Zoom Meeting ID ${zoomMeetingId} with file ${file.id}`,
            );

            //after successfull upload,
            try {
              await deleteRecordingFile( zoomMeetingId,file.id);
              logger.info(`[Cron] Successfully deleted Zoom cloud recording for meeting ${zoomMeetingId}`);
            } catch (error) {
              logger.error(`[Cron] Failed to delete Zoom cloud recording for meeting ${zoomMeetingId}:`, error);
            }
          } else {
            logger.warn(
              `[Cron] Unsupported file type ${file.file_type} for Zoom Meeting ID ${zoomMeetingId}, skipping.`,
            );
            continue;
          }
          // skip that file
        } catch (error) {
          logger.error(
            `[Cron] Error processing recording file ${file.id} for Zoom Meeting ID ${zoomMeetingId}:`,
            error,
          );
        }
      }

      processedMeetings++;
    }

    logger.info(
      `[Cron] Zoom recording sync completed. Processed ${processedMeetings} meetings.`,
    );
    return {
      message: 'Zoom recording sync completed',
      processed: processedMeetings,
    };
  } catch (error) {
    logger.error('[Cron] Zoom recording sync failed:', error);
    throw error;
  }
}

// used in zoom webhook. Currently not in use
export async function processRecording(
  downloadUrl: string,
  fileName: string,
  meetingId: string,
): Promise<string> {
  const accessToken = await getZoomAccessToken();
  const response = await fetch(`${downloadUrl}?access_token=${accessToken}`, {
    method: 'GET',
    redirect: 'follow',
  });

  if (!response.ok) {
    throw new Error(`Failed to download: ${response.statusText}`);
  }
  if (response.ok) {
    console.log(`Downloaded recording from Zoom: ${fileName}`);
  }
  //   const fileStream = response.body as NodeJS.ReadableStream;
  //   const signedUrl = await uploadToS3(fileStream, fileName);
  //   console.log(`Uploaded ${fileName} to S3. Viewable at: ${signedUrl}`);

  const signedUrl = 'https://example.com/signed-url'; // Placeholder for the actual signed URL from S3 upload

  //delete the recording from Zoom
  //   await deleteZoomRecording(meetingId);

  return signedUrl;
}
