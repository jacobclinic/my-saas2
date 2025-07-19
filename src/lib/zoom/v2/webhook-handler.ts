import crypto from 'crypto';
import { ZoomWebhookPayload } from '~/app/api/public/zoom/webhook/route';
import getLogger from '~/core/logger';

const logger = getLogger();

export const zoomWebhookEvents = {
    ENDPOINT_URL_VALIDATION: 'endpoint.url_validation',
    MEETING_ENDED: 'meeting.ended',
    RECORDING_COMPLETED: 'recording.completed',
} as const;


const ZOOM_WEBHOOK_SECRET_TOKEN = process.env.ZOOM_SECRET_TOKEN as string;


export const ZoomWebhookEventHandlerRegistry = {
    [zoomWebhookEvents.ENDPOINT_URL_VALIDATION]: verifyZoomWebhookUrl,
    [zoomWebhookEvents.RECORDING_COMPLETED]: processZoomRecording,
} as const;

function verifyZoomWebhookUrl(data: ZoomWebhookPayload) {
    try {
        const plainToken = data.payload.plainToken;
        const hash = crypto.createHmac('sha256', ZOOM_WEBHOOK_SECRET_TOKEN)
            .update(plainToken as string)
            .digest('hex');

        const response = { plainToken, encryptedToken: hash }
        return response;

    } catch (error) {
        logger.error('Error verifying Zoom webhook URL:', error);
        throw error;
    }
}


function processZoomRecording(data: ZoomWebhookPayload) {
    try {

    } catch (error) {
        logger.error('Error processing Zoom recording:', error);
        throw error;
    }
}
