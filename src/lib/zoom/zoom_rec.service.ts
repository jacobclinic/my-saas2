import fetch from 'node-fetch';
import { uploadToS3 } from '~/lib/aws/s3.service'; // Import S3 upload function
import { ZoomTokenResponse } from './types/zoom.types';

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
  const accessToken = await getZoomAccessToken();
  const response = await fetch(`${downloadUrl}?access_token=${accessToken}`, {
    method: 'GET',
    redirect: 'follow',
  });

  if (!response.ok) {
    throw new Error(`Failed to download: ${response.statusText}`);
  }
  if( response.ok){
    console.log(`Downloaded recording from Zoom: ${fileName}`);
  }
//   const fileStream = response.body as NodeJS.ReadableStream;
//   const signedUrl = await uploadToS3(fileStream, fileName);
//   console.log(`Uploaded ${fileName} to S3. Viewable at: ${signedUrl}`);

  const signedUrl = "https://example.com/signed-url"; // Placeholder for the actual signed URL from S3 upload

  //delete the recording from Zoom
//   await deleteZoomRecording(meetingId);

  return signedUrl;
}
