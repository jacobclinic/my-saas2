import { NextRequest, NextResponse } from 'next/server';
import getLogger from '~/core/logger';
import { StudentSessionService } from '~/lib/sessions/services/student-session.service';
import getSupabaseRouteHandlerClient from '~/core/supabase/route-handler-client';
// import { verifySignature } from '@upstash/qstash/nextjs'; // Temporarily disabled
import { ZoomWebhookEvent } from '~/lib/zoom/v2/types';

const logger = getLogger();

async function handler(request: NextRequest) {
  try {
    // Check if service role key exists
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      logger.error('SUPABASE_SERVICE_ROLE_KEY environment variable not found');
      return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 });
    }

    logger.info(`[QStash] Using service role client - Key present: ${!!serviceRoleKey}, Key length: ${serviceRoleKey.length}`);
    const client = getSupabaseRouteHandlerClient({ admin: true });
    const service = new StudentSessionService(client, logger);

    logger.info('[QStash] Processing Zoom event from queue');

    const body = await request.json();
    const zoomEvent: ZoomWebhookEvent = body;

    // Safely extract meeting ID from payload
    const meetingId = (zoomEvent.payload as any)?.object?.id;

    logger.info('[QStash] Zoom event details', {
      event: zoomEvent.event,
      eventTs: zoomEvent.event_ts,
      meetingId,
    });

    // Call the service to process the event
    const result = await service.processSessionWebhookEvent(zoomEvent.event, zoomEvent.payload);

    if (!result.success) {
      logger.error('[QStash] Failed to process Zoom event', {
        error: result.error.message,
        event: zoomEvent.event,
        meetingId,
      });
      // Return a non-200 status to let QStash know it should retry the message
      return new NextResponse(result.error.message, { status: 500 });
    }

    logger.info('[QStash] Successfully processed Zoom event', {
      event: zoomEvent.event,
      meetingId,
    });

    // Return 200 to confirm successful processing
    return new NextResponse('Event processed successfully', { status: 200 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('[QStash] Error processing Zoom event from QStash', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    // Return a non-200 status for QStash to retry
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Note: Signature verification temporarily disabled for type compatibility
// TODO: Fix signature verification to work with App Router
export const POST = handler;

export async function GET() {
  return NextResponse.json({
    message: 'Zoom Event Processor - POST only',
    status: 'healthy'
  }, { status: 405 });
}