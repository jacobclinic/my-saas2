import fetch from 'node-fetch';
import { uploadToS3 } from '~/lib/aws/s3.service'; // Import S3 upload function
import { ZoomRecordingResponse, ZoomTokenResponse } from './types/zoom.types';
import getLogger from '~/core/logger';

const logger = getLogger();
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

// Delete Zoom recording
export async function deleteZoomRecording(meetingId: string): Promise<void> {
  const accessToken = await getZoomAccessToken();
  const url = `https://api.zoom.us/v2/meetings/${meetingId}/recordings`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete Zoom recording: ${response.statusText}`);
  }
  console.log(`Deleted Zoom recording for meeting ${meetingId}`);
}

// Process recording: download, upload to S3, delete from Zoom, return URL
export async function processRecording(
  downloadUrl: string,
  fileName: string,
  meetingId: string,
): Promise<string> {
  const logger = getLogger();
  const accessToken = await getZoomAccessToken();
  //   const response = await fetch(`${downloadUrl}?access_token=${accessToken}`, {
  //     method: 'GET',
  //     redirect: 'follow',
  //   });

  //   if (!response.ok) {
  //     throw new Error(`Failed to download: ${response.statusText}`);
  //   }
  //   if (response.ok) {
  //     console.log(`Downloaded recording from Zoom: ${fileName}`);
  //   }

  //   const fileStream = response.body as NodeJS.ReadableStream;
  // const signedUrl = await uploadToS3(fileStream, fileName);
  //   console.log(`Uploaded ${fileName} to S3. Viewable at: ${signedUrl}`);

  const signedUrl = downloadUrl; // Placeholder for the actual signed URL from S3 upload

  //delete the recording from Zoom
  //   await deleteZoomRecording(meetingId);

  return signedUrl;
}

// Fetch recording details and return the download URL
export async function getRecordingDownloadUrl(
  meetingId: string,
): Promise<{ downloadUrl: string; password?: string }> {
  const accessToken = await getZoomAccessToken();
  // const meetingUuid = encodeURIComponent(meetingId);
  const url = `https://api.zoom.us/v2/meetings/${meetingId}/recordings`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error(
      `[Zoom] Failed to fetch recording for meeting ${meetingId}: ${response.statusText} `,
    );
    logger.error(`[Zoom] Error details: ${errorText}`);
    
    throw new Error(`Failed to fetch recording: ${response.statusText}`);
  }

  const recordingData = await response.json() as ZoomRecordingResponse;;
  for (const file of recordingData.recording_files || []) {
    if (file.file_type === 'MP4') {
      return {
        downloadUrl: file.download_url,
        password: recordingData.password || undefined,
      };
    }
  }

  throw new Error(`No MP4 recording found for meeting ${meetingId}`);
}

// Download the recording as a stream
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
