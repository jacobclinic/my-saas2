import { NextResponse } from "next/server";
import { ZoomWebhookEventHandlerRegistry } from "~/lib/zoom/v2/webhook-handler";
import crypto from 'crypto';

export type ZoomWebhookPayload = {
  event: string;
  payload: any;
}

const ZOOM_WEBHOOK_SECRET_TOKEN = process.env.ZOOM_SECRET_TOKEN as string;

export async function POST(req: Request) {
  try {
    const isAuthenticated = await isAutheticatedRequest(req);
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const dataPayload: ZoomWebhookPayload = await req.json();
    const handlerKey = dataPayload.event as keyof typeof ZoomWebhookEventHandlerRegistry;
    const handler = ZoomWebhookEventHandlerRegistry[handlerKey];
    if (!handler) {
      return NextResponse.json({ error: 'Invalid event' }, { status: 400 });
    }
    const response = handler(dataPayload);
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function isAutheticatedRequest(request: Request) {
  const message = `v0:${request.headers.get('x-zm-request-timestamp')}:${JSON.stringify(request.body)}`;
  const hashForVerify = crypto.createHmac('sha256', ZOOM_WEBHOOK_SECRET_TOKEN).update(message).digest('hex');
  const signature = `v0=${hashForVerify}`
  if (request.headers.get("x-zm-signature") === signature) {
    // Valid zoom webhook request
    return true;
  }
  return false;
}



// import { NextRequest, NextResponse } from 'next/server';
// import { processRecording } from '~/lib/zoom/zoom-other.service'; // Adjust path if needed

// import crypto from 'crypto';
// import getLogger from '~/core/logger';
// import { updateRecordingUrl } from '~/lib/sessions/database/mutations';
// import getSupabaseServerActionClient from '~/core/supabase/action-client';
// import { ZoomWebhookPayload } from '~/lib/zoom/types/zoom.types';

// export async function POST(req: NextRequest) {
//   const payload: ZoomWebhookPayload = await req.json();
//   const logger = getLogger();
//   const client = getSupabaseServerActionClient();

//   // Handle Zoom URL validation
//   if (payload.event === 'endpoint.url_validation') {
//     const { plainToken } = payload.payload;
//     const hash = crypto
//       .createHmac('sha256', process.env.ZOOM_SECRET_TOKEN as string)
//       .update(plainToken as string)
//       .digest('hex');
//     return NextResponse.json(
//       { plainToken, encryptedToken: hash },
//       { status: 200 },
//     );
//   }

//   // Handle recording completed event
//   if (payload.event === 'recording.completed') {
//     logger.info(
//       `[Zoom] Recording completed for meeting ID: ${payload.payload.object.id}`,
//     );
//     const recordingFiles = payload.payload.object.recording_files;
//     const meetingId = payload.payload.object.id;

//     for (const file of recordingFiles) {
//       if (file.file_type === 'MP4') {
//         const downloadUrl = file.download_url;
//         logger.info(`Processing recording file: ${downloadUrl}`);
//         const fileName = `${meetingId}-${file.id}.mp4`;
//         try {
//           const signedUrl = await processRecording(
//             downloadUrl,
//             fileName,
//             meetingId,
//           );
//           console.log(`Recording available at: ${signedUrl}`);
//           logger.info(`Recording available at: ${signedUrl}`);

//           const updateRecUrl = await updateRecordingUrl(
//             client,
//             payload.payload.object.id,
//             signedUrl,
//           );
//           if (updateRecUrl) {
//             console.log(`Updated recording URL for meeting ID: ${meetingId}`);
//             logger.info(`Updated recording URL for meeting ID: ${meetingId}`);
//           } else {
//             console.error(
//               `Failed to update recording URL for meeting ID: ${meetingId}`,
//             );
//             logger.error(
//               `Failed to update recording URL for meeting ID: ${meetingId}`,
//             );
//           }
//         } catch (error) {
//           console.error(`Error processing ${fileName}:`, error);
//           logger.error(`Error processing ${fileName}:`, error);
//         }
//       }
//     }
//     return NextResponse.json(
//       { message: 'Recording processed' },
//       { status: 200 },
//     );
//   }

//   return NextResponse.json({ error: 'Unhandled event' }, { status: 400 });
// }
