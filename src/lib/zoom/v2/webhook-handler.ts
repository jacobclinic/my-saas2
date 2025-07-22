import crypto from 'crypto';
import getLogger from '~/core/logger';
import { ZoomWebhookEvent, ZoomWebhookPayload } from '~/lib/zoom/v2/types';

const logger = getLogger();

export const zoomWebhookEvents = {
    ENDPOINT_URL_VALIDATION: 'endpoint.url_validation',
    MEETING_ENDED: 'meeting.ended',
    RECORDING_COMPLETED: 'recording.completed',
    MEETING_PARTICIPANT_LEFT: "meeting.participant_left​"
} as const;


const ZOOM_WEBHOOK_SECRET_TOKEN = process.env.ZOOM_SECRET_TOKEN as string;


export const ZoomWebhookEventHandlerRegistry = {
    [zoomWebhookEvents.ENDPOINT_URL_VALIDATION]: verifyZoomWebhookUrl,
    [zoomWebhookEvents.RECORDING_COMPLETED]: processZoomRecording,
    [zoomWebhookEvents.MEETING_ENDED]: processStudentAttendence,

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

function processStudentAttendence(data: ZoomWebhookEvent) {
    try {
        if (data.event === zoomWebhookEvents.MEETING_ENDED) {
            const newData = data.payload.object.start_time
            // Todo: Update the session details,
            // Start student attendence
        }
    } catch (error) {
        logger.error('Error processing student attendence:', error);
        throw error;
    }
}
