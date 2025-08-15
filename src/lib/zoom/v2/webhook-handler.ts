import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import getLogger from '~/core/logger';
import { markAttendanceAction } from '~/lib/attendance/server-actions';
import { ZoomWebhookEvent, ZoomWebhookPayload } from '~/lib/zoom/v2/types';

const logger = getLogger();

export const zoomWebhookEvents = {
    ENDPOINT_URL_VALIDATION: 'endpoint.url_validation',
    MEETING_ENDED: 'meeting.ended',
    RECORDING_COMPLETED: 'recording.completed',
    MEETING_PARTICIPANT_LEFT: "meeting.participant_left​"
} as const;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseClient = createClient(supabaseUrl!, supabaseKey!, {
    auth: {
        persistSession: false,
    },
});


const ZOOM_WEBHOOK_SECRET_TOKEN = process.env.ZOOM_SECRET_TOKEN as string;


export const ZoomWebhookEventHandlerRegistry = {
    [zoomWebhookEvents.ENDPOINT_URL_VALIDATION]: verifyZoomWebhookUrl,
    [zoomWebhookEvents.RECORDING_COMPLETED]: processZoomRecording,
    [zoomWebhookEvents.MEETING_ENDED]: processMeetingEnded,

} as const;

function verifyZoomWebhookUrl(data: ZoomWebhookEvent) {
    try {
        if (data.event === zoomWebhookEvents.ENDPOINT_URL_VALIDATION) {
            const plainToken = data.payload.plainToken;
            const hash = crypto.createHmac('sha256', ZOOM_WEBHOOK_SECRET_TOKEN)
                .update(plainToken as string)
                .digest('hex');

            const response = { plainToken, encryptedToken: hash }
            return response;
        }
    } catch (error) {
        logger.error('Error verifying Zoom webhook URL:', error);
        throw error;
    }
}


function processZoomRecording(data: ZoomWebhookEvent) {
    try {

    } catch (error) {
        logger.error('Error processing Zoom recording:', error);
        throw error;
    }
}

async function processMeetingEnded(data: ZoomWebhookEvent) {
    try {
        if (data.event === zoomWebhookEvents.MEETING_ENDED) {
            const newData = data.payload.object.start_time
            // Todo: Update the session details,
            // Todo: Start student attendance
            await markAttendanceAction(supabaseClient);
        }
    } catch (error) {
        logger.error('Error processing student attendance:', error);
        throw error;
    }
}

