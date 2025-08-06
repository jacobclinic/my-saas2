import { zoomClient, ZoomClient } from "./client";
import getLogger from "~/core/logger";
import { createUnassignedZoomUser, updateZoomUser } from "./database/mutations";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "~/database.types";
import getSupabaseServerActionClient from "~/core/supabase/action-client";
import { getSessionsTillTomorrowWithZoomUser } from "~/lib/sessions/database/queries";
import { createZoomSession } from "~/lib/zoom_sessions/database/mutations";
import { ZoomCreateUserMeetingRequest, ZoomCreateUserRequest, ZoomMeetingRecordingUrl } from "./types";
import { ZOOM_SESSIONS_TABLE } from "~/lib/db-tables";
import { getAllUnassignedZoomUsers, getAllZoomUsersWithTutor, getZoomUserByTutorId } from "./database/queries";
import { ZoomError } from "~/lib/shared/errors";
import { failure, Result, success } from "~/lib/shared/result";


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

            if (!user.tutor_id) {
                throw new Error('Cannot create a zoom user without a tutor ID');
            }
            const { data: existingZoomUser, error } = await getZoomUserByTutorId(this.supabaseClient, user.tutor_id);

            if (error && error.code !== 'PGRST116') {
                logger.info("No zoom user found for the tutor ID, creating a new one.");
            }

            if (existingZoomUser) {
                logger.warn(`Zoom user already exists for tutor ID: ${user.tutor_id}`);
                return existingZoomUser;
            }
            const allUnassignedZoomUsers = await getAllUnassignedZoomUsers(this.supabaseClient);

            if (!allUnassignedZoomUsers || allUnassignedZoomUsers.length === 0) {
                throw new Error('No unassigned Zoom users are available to assign.');
            }

            const randomUnassignedZoomUser = allUnassignedZoomUsers[0];
            user.user_info.email = randomUnassignedZoomUser.email;

            const zoomUser = await this.client.createUser(user);

            await updateZoomUser(this.supabaseClient, randomUnassignedZoomUser.id, {
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

    async checkIfZoomSessionExists(sessionId: string) {
        try {
            const zoomSession = await this.supabaseClient
                .from(ZOOM_SESSIONS_TABLE)
                .select('*')
                .eq('session_id', sessionId)
                .single();
            if (!zoomSession.data) {
                return null;
            }
            return zoomSession;
        } catch (error) {
            logger.error(error, "Failed to check if zoom session exists");
            throw new Error('Failed to check if zoom session exists. Please try again.');
        }
    }

    async getZoomSessionsByIdList(sessionId: string[]) {
        try {
            const meetings = await this.supabaseClient
                .from(ZOOM_SESSIONS_TABLE)
                .select('*')
                .in('session_id', sessionId);
            return meetings;
        } catch (error) {
            logger.error(error, "Failed to get zoom meetings by IDs");
            throw new Error('Failed to get zoom meetings by IDs. Please try again.');
        }
    }

    async getExistingZoomSessionsIds(sessionIds: string[]) {
        try {
            const meetings = await this.getZoomSessionsByIdList(sessionIds);
            const meetingIds = meetings.data?.map(meeting => meeting.session_id) || [];
            if (meetingIds.length === 0) {
                return [];
            }
            return meetingIds;
        } catch (error) {
            logger.error(error, "Failed to get existing zoom sessions");
            return [];
        }
    }

    async createMeetingsForTomorrowSessions() {
        try {
            // This will return all sessions that are scheduled for tomorrow.starting from 12 am to 11:59:59 pm.
            // const tomorrowSessions = await getTomorrowsSessionsWithZoomUser(this.supabaseClient);

            // This will return all sessions that are being scheduled till tomorrow midnight.
            const tomorrowSessions = await getSessionsTillTomorrowWithZoomUser(this.supabaseClient);
            const sessionIds = tomorrowSessions.map(session => session.id);
            const existingZoomSessionIds = await this.getExistingZoomSessionsIds(sessionIds);
            let successCount = 0;
            let errorCount = 0;

            if (tomorrowSessions.length === 0) {
                logger.info("No sessions to create zoom meetings for tomorrow");
                return;
            }

            for (const session of tomorrowSessions) {
                logger.info(`Processing session: ${session.id}`);
                if (existingZoomSessionIds.includes(session.id)) {
                    logger.warn(`Skipping ${session.id} : Zoom session already exists`);
                    continue;
                }
                if (session.class?.tutor && session.class.tutor.zoom_user.length === 0) {
                    // Skip the loop for this session,
                    logger.warn(`Skipping ${session.id} : Tutor is not associated with any zoom user`);
                    continue;
                }
                const zoomUserId = session.class.tutor.zoom_user[0].zoom_user_id;
                if (zoomUserId) {

                    try {

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

                        await createZoomSession(this.supabaseClient, createZoomSessionPayload);
                        // Wait for 50ms to avoid rate limiting
                        await new Promise(resolve => setTimeout(resolve, 50));
                        successCount++;
                    } catch (error) {
                        const errorMessage = `Failed to create the zoom meeting for the session: ${session.id} for the user: ${zoomUserId}. Tutor ID: ${session.class.tutor.id}`;
                        logger.error(error, errorMessage);
                        errorCount++;
                        continue;
                    }

                }
            }

            if (errorCount > 0) {
                logger.error(`Failed to create ${errorCount} zoom meetings for tomorrow sessions`);
            }

            if (successCount > 0) {
                logger.info(`Successfully created ${successCount} zoom meetings for tomorrow sessions`);
                return tomorrowSessions;
            } else {
                logger.info('No new zoom meetings were created (all sessions may have existing zoom meetings or invalid tutors)');
            }
            return [];
        } catch (error) {
            throw new Error('Failed to create zoom meetings for tomorrow sessions. Please try again.');
        }
    }

    async getZoomMeetingRecordingUrls(meetingId: string): Promise<ZoomMeetingRecordingUrl[]> {
        try {
            const recordingUrls: ZoomMeetingRecordingUrl[] = [];
            const recordings = await this.client.getMeetingRecordings(meetingId);
            logger.info(`Fetched recordings for meeting ID: ${meetingId}`, recordings);
            if (recordings && recordings.recording_files && recordings.recording_files.length > 0) {
                for (const file of recordings.recording_files) {
                    if (file.file_extension && file.file_extension.toLowerCase() === 'mp4') {
                        const downloadUrl = file.download_url;
                        recordingUrls.push({
                            play_url: file.play_url,
                            download_url: downloadUrl,
                        });
                    }
                }
            }
            return recordingUrls;
        } catch (error) {
            logger.error(error, "Failed to get zoom meeting recordings");
            throw new Error('Failed to get zoom meeting recordings. Please try again.');
        }
    }

    async checkIfZoomUserValid(tutorId: string) : Promise<Result<boolean, ZoomError>>{
        try {
            const tutorZoomUser = await getZoomUserByTutorId(this.supabaseClient, tutorId);
            if (tutorZoomUser.data) {
                const zoomUserExternalId = tutorZoomUser.data.zoom_user_id;
                if (!zoomUserExternalId) {
                    return failure(new ZoomError('Zoom portal user is not yet created.'));
                }
                const zoomUser = await this.client.getUserById(zoomUserExternalId);
                if (zoomUser && zoomUser.verified === 1) {
                    return success(true);
                }
            }
            return failure(new ZoomError('Zoom portal user is not yet created.'));
        } catch (error) {
            logger.error(error, "Failed to check if zoom user valid");
            return failure(new ZoomError('Failed to check if zoom user valid.'));
        }
    }

    async getAllZoomUsers() {
        try {
            const zoomUsers = await getAllZoomUsersWithTutor(this.supabaseClient);
            return zoomUsers;
        } catch (error) {
            logger.error(error, "Failed to get all zoom users");
            return [];
        }
    }

    async createUnassignedZoomUser(email: string) {
        try {
            const zoomUser = await createUnassignedZoomUser(this.supabaseClient, email);
            return zoomUser;
        } catch (error) {
            logger.error(error, "Failed to create unassigned zoom user");
            throw error;
        }
    }
}
