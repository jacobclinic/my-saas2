import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import getLogger from '~/core/logger';
import { markAttendanceAction } from '~/lib/attendance/server-actions';
import { AttendanceService } from '~/lib/attendance/attendence.service';
import { ZoomWebhookEvent } from '~/lib/zoom/v2/types';
import { ZoomParticipantLeftWebhookPayload } from '~/lib/zoom/v2/types';

const logger = getLogger();

export const zoomWebhookEvents = {
    ENDPOINT_URL_VALIDATION: 'endpoint.url_validation',
    MEETING_ENDED: 'meeting.ended',
    RECORDING_COMPLETED: 'recording.completed',
    MEETING_PARTICIPANT_LEFT: "meeting.participant_left"
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
    [zoomWebhookEvents.MEETING_PARTICIPANT_LEFT]: processMeetingParticipantLeft,


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

async function processMeetingParticipantLeft(data: ZoomWebhookEvent) {
    try {
        if (data.event === zoomWebhookEvents.MEETING_PARTICIPANT_LEFT) {
            const customerKey = data.payload.object.participant.customer_key;
            
            logger.info('Processing meeting participant left event', {
                meetingId: data.payload.object.id,
                customerKey,
                participantName: data.payload.object.participant.user_name,
                leaveTime: data.payload.object.participant.leave_time,
            });

            if (!customerKey || customerKey.trim() === '') {
                logger.info('No customer key provided, skipping attendance marking', {
                    meetingId: data.payload.object.id,
                    participantName: data.payload.object.participant.user_name,
                });
                return { success: true, message: 'No customer key provided' };
            }


            const attendanceService = new AttendanceService(supabaseClient, logger);
            const result = await attendanceService.markStudentAttendance(customerKey, data);

            if (!result.success) {
                logger.error('Failed to mark student attendance', {
                    error: result.error.message,
                    customerKey,
                    meetingId: data.payload.object.id,
                });
                return { success: false, error: result.error.message };
            }

            logger.info('Successfully processed participant left and marked attendance', {
                customerKey,
                attendanceRecordId: result.data.id,
                meetingId: data.payload.object.id,
            });

            return { success: true, attendanceRecordId: result.data.id };
        }
    } catch (error) {
        logger.error('Error processing meeting participant left:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}
