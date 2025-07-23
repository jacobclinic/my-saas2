import { zoomClient, ZoomClient } from "./client";
import getLogger from "~/core/logger";
import { createZoomUser } from "./database/mutations";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "~/database.types";
import getSupabaseServerActionClient from "~/core/supabase/action-client";
import { getTomorrowsSessionsWithZoomUser } from "~/lib/sessions/database/queries";
import { createZoomSession } from "~/lib/zoom_sessions/database/mutations";

const logger = getLogger();

export class ZoomService {
    private client: ZoomClient;
    private supabaseClient: SupabaseClient<Database>;

    constructor(supabaseClient?: SupabaseClient<Database>) {
        this.client = zoomClient
        this.supabaseClient = supabaseClient || getSupabaseServerActionClient();
    }

    async createZoomUser(user: ZoomCreateUserRequest) {
        try {

            if(!user.tutor_id){
                throw new Error('Cannot create a zoom user without a tutor ID');
            }

            const zoomUser = await this.client.createUser(user);

            await createZoomUser(this.supabaseClient, {
                ...zoomUser,
                tutor_id: user.tutor_id,
            });
        } catch (error) {
            logger.error('Error creating zoom user:', error);
            throw new Error('Failed to create zoom user. Please try again.');
        }
    }

    async createZoomUserMeeting(userMeeting: ZoomCreateUserMeetingRequest) {
        try {
            const zoomUserMeeting = await this.client.createUserMeeting(userMeeting);
            return zoomUserMeeting;
        } catch (error) {
            logger.error(error, "Failed to create the zoom meeting");
            throw new Error('Failed to create zoom user meeting. Please try again.');
        }
    }

    async getZoomUserMeetings(userId: string) {
        try {
            const zoomUserMeetings = await this.client.getUserMeetings(userId);
            return zoomUserMeetings;
        } catch (error) {
            logger.error(error, "Failed to get the zoom user meetings");
            throw new Error('Failed to get zoom user meetings. Please try again.');
        }
    }

    async createMeetingsForTomorrowSessions() {
        try {
            const tomorrowSessions = await getTomorrowsSessionsWithZoomUser(this.supabaseClient);
            for (const session of tomorrowSessions) {

                if (session.class?.tutor && session.class.tutor.zoom_user.length === 0) {
                    // Skip the loop for this session,
                    continue;
                }
                const zoomUserId = session.class.tutor.zoom_user[0].zoom_user_id;
                if (zoomUserId) {
                    const meetingTitle = session.title || session.class.name;
                    const sessionStartTime = new Date(session.start_time!);
                    const sessionEndTime = new Date(session.end_time!);
                    const meetingDurationMinutes = Math.round((sessionEndTime.getTime() - sessionStartTime.getTime()) / (1000 * 60));

                    const meeting = await this.createZoomUserMeeting({
                        userId: zoomUserId,
                        body: {
                            topic: meetingTitle!,
                            agenda: session.description!,
                            default_password: false,
                            duration: meetingDurationMinutes,
                            password: "123456",
                            pre_schedule: false,
                            start_time: sessionStartTime.toISOString(),
                            type: 2,
                            timezone: "UTC",
                            auto_recording: 'cloud',
                            email_notification: false,
                            join_before_host: true,
                            jbh_time: 15,
                        }
                    });

                    const createZoomSessionPayload = {
                        session_id: session.id,
                        meeting_uuid: meeting.uuid,
                        meeting_id: meeting.id!.toString(),
                        host_id: zoomUserId,
                        host_user_id: session.class.tutor.id,
                        type: meeting.type,
                        status: meeting.status,
                        start_time: sessionStartTime.toISOString(),
                        duration: meetingDurationMinutes,
                        timezone: "UTC",
                        join_url: meeting.join_url,
                        start_url: meeting.start_url,
                        password: "123456",
                        settings_json: meeting.settings,
                        creation_source: meeting.creation_source,
                    }

                    const zoomSession = await createZoomSession(this.supabaseClient,createZoomSessionPayload);
                    // Wait for 50ms to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 50));
                }
            }
            return tomorrowSessions;
        } catch (error) {
            logger.error(error, "Failed to create the zoom meetings for tomorrow sessions");
            throw new Error('Failed to create zoom meetings for tomorrow sessions. Please try again.');
        }
    }
}

// export const zoomService = new ZoomService();