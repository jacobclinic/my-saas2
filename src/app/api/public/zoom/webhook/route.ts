import { NextResponse } from 'next/server';
import getLogger from '~/core/logger';

import {
  throwInternalServerErrorException,
} from '~/core/http-exceptions';

/**
 * @description Handle the webhooks from Zoom related to meetings
 */
export async function POST(request: Request) {
  const logger = getLogger();
  const zoomEvent: any = await request.json();
  logger.info(`[Zoom] Received Zoom Webhook`);
  // Zoom Challenge Validation (for first-time setup)
  if (zoomEvent?.event === "endpoint.url_validation") {
    const hashForValidation = require("crypto")
      .createHmac("sha256", process.env.ZOOM_SECRET_TOKEN!)
      .update(zoomEvent.payload.plainToken)
      .digest("hex");

    return NextResponse.json({
      plainToken: zoomEvent.payload.plainToken,
      encryptedToken: hashForValidation,
    });
  }

  // Log received event
  console.log("📩 Received Zoom Event:", zoomEvent?.payload);

  try {

    logger.info(
      {
        type: zoomEvent.event.type,
      },
      `[Zoom] Processing Zoom Webhook...`,
    );

    switch (zoomEvent.event) {
        case "meeting.started":
            console.log(`📢 Meeting Started: ${zoomEvent.payload.object.id}`);
            break;
        case "meeting.ended":
            console.log(`⏹ Meeting Ended: ${zoomEvent.payload.object.id}`);
            break;
        case "recording.completed":
            console.log(`🎥 Recording Available: ${zoomEvent.payload.object.recording_files[0].download_url}`);
            break;
        default:
            console.log("⚠️ Unknown Event Received");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error(
      {
        error,
      },
      `[Zoom] Webhook handling failed`,
    );

    return throwInternalServerErrorException();
  }
}
