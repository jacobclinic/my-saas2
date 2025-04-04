// import { NextResponse } from 'next/server';
// import getLogger from '~/core/logger';
// import { buffer } from "micro";

// import {
//   throwInternalServerErrorException,
// } from '~/core/http-exceptions';

// export const config = {
//   api: {
//     bodyParser: false, // Disable default body parsing since Zoom sends raw JSON
//   },
// };
// /**
//  * @description Handle the webhooks from Zoom related to meetings
//  */
// export async function POST(request: Request) {
//   const logger = getLogger();
//   const rawBody = await buffer(request);
//   const payload = JSON.parse(rawBody.toString());
//   logger.info(`[Zoom] Received Zoom Webhook`);
//   // Zoom Challenge Validation (for first-time setup)
//   if (zoomEvent?.event === "endpoint.url_validation") {
//     const hashForValidation = require("crypto")
//       .createHmac("sha256", process.env.ZOOM_SECRET_TOKEN!)
//       .update(zoomEvent.payload.plainToken)
//       .digest("hex");

//     return NextResponse.json({
//       plainToken: zoomEvent.payload.plainToken,
//       encryptedToken: hashForValidation,
//     });
//   }

//   // Log received event
//   console.log("📩 Received Zoom Event:", zoomEvent?.payload);

//   try {

//     logger.info(
//       {
//         type: zoomEvent.event.type,
//       },
//       `[Zoom] Processing Zoom Webhook...`,
//     );

//     switch (zoomEvent.event) {
//         case "meeting.started":
//             console.log(`📢 Meeting Started: ${zoomEvent.payload.object.id}`);
//             break;
//         case "meeting.ended":
//             console.log(`⏹ Meeting Ended: ${zoomEvent.payload.object.id}`);
//             break;
//         case "recording.completed":
//             console.log(`🎥 Recording Available: ${zoomEvent.payload.object.recording_files[0].download_url}`);
//             const recordingFiles = payload.payload.object.recording_files;
//             const meetingId = payload.payload.object.id;

//             // Process each recording file (e.g., video, audio, etc.)
//             for (const file of recordingFiles) {
//               if (file.file_type === "MP4") { // Filter for video files
//                 const downloadUrl = file.download_url;
//                 const fileName = `${meetingId}-${file.id}.mp4`;

//                 // Trigger the download and upload process (async)
//                 await processRecording(downloadUrl, fileName);
//               }
//             }

//             return res.status(200).json({ message: "Recording processed" });
//           }
//             break;
//         default:
//             console.log("⚠️ Unknown Event Received");
//     }

//     return NextResponse.json({ success: true });
//   } catch (error) {
//     logger.error(
//       {
//         error,
//       },
//       `[Zoom] Webhook handling failed`,
//     );

//     return throwInternalServerErrorException();
//   }
// }


import { NextRequest, NextResponse } from "next/server";
import { processRecording } from "~/lib/zoom/zoom_rec.service"; // Adjust path if needed
import { ZoomWebhookPayload } from "~/lib/zoom/types/zoom.types";
import crypto from "crypto";
import getLogger from "~/core/logger";
import { updateRecordingUrl } from "~/lib/sessions/database/mutations";
import getSupabaseServerActionClient from "~/core/supabase/action-client";

export async function POST(req: NextRequest) {
  const payload: ZoomWebhookPayload = await req.json();
  const logger = getLogger();
  const client = getSupabaseServerActionClient();

  // Handle Zoom URL validation
  if (payload.event === "endpoint.url_validation") {
    const { plainToken } = payload.payload;
    const hash = crypto
      .createHmac("sha256", process.env.ZOOM_SECRET_TOKEN as string)
      .update(plainToken as string)
      .digest("hex");
    return NextResponse.json({ plainToken, encryptedToken: hash }, { status: 200 });
  }

  // Handle recording completed event
  if (payload.event === "recording.completed") {
    logger.info(`[Zoom] Recording completed for meeting ID: ${payload.payload.object.id}`);
    const recordingFiles = payload.payload.object.recording_files;
    const meetingId = payload.payload.object.id;

    for (const file of recordingFiles) {
      if (file.file_type === "MP4") {
        const downloadUrl = file.download_url;
        const fileName = `${meetingId}-${file.id}.mp4`;
        try {
          const signedUrl = await processRecording(downloadUrl, fileName, meetingId);
          console.log(`Recording available at: ${signedUrl}`);
          logger.info(`Recording available at: ${signedUrl}`);

          const updateRecUrl = await updateRecordingUrl(client, payload.payload.object.id, signedUrl);
          if (updateRecUrl) {
            console.log(`Updated recording URL for meeting ID: ${meetingId}`);
            logger.info(`Updated recording URL for meeting ID: ${meetingId}`);
          } else {
            console.error(`Failed to update recording URL for meeting ID: ${meetingId}`);
            logger.error(`Failed to update recording URL for meeting ID: ${meetingId}`);
          }
        } catch (error) {
          console.error(`Error processing ${fileName}:`, error);
          logger.error(`Error processing ${fileName}:`, error);
        }
      }
    }
    return NextResponse.json({ message: "Recording processed" }, { status: 200 });
  }

  return NextResponse.json({ error: "Unhandled event" }, { status: 400 });
}