import { zoomClient, ZoomClient } from "./client";
import getLogger from "~/core/logger";
import { createZoomUser } from "./database/mutations";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "~/database.types";
import getSupabaseServerActionClient from "~/core/supabase/action-client";

const logger = getLogger();

export class ZoomService {
    private client: ZoomClient;
    private supabaseClient: SupabaseClient<Database>;

    constructor() {
        this.client = zoomClient
        this.supabaseClient = getSupabaseServerActionClient();
    }

    async createZoomUser(user: ZoomCreateUserRequest) {
        try {
            const zoomUser = await this.client.createUser(user);

            await createZoomUser(this.supabaseClient, {
                ...zoomUser,
                tutor_id: "ff0abf81-840a-4734-b423-da9a75f7fa59",
            });
        } catch (error) {
            logger.error('Error creating zoom user:', error);
            throw new Error('Failed to create zoom user. Please try again.');
        }
    }

    async createZoomUserMeeting(userMeeting?: ZoomCreateUserMeetingRequest) {
        try {
            const dummyPayload: ZoomCreateUserMeetingRequest = {
                userId: "QIfQsEAxR7WRAg1lDZAvtg",
                body: {
                    topic: "Test Meeting",
                    agenda: "Test Meeting",
                    default_password: true,
                    duration: 360,
                    password: "123456",
                    pre_schedule: false,
                    start_time: "2025-08-31T07:30:00Z",
                    type: 2,
                }
            }
            const zoomUserMeeting = await this.client.createUserMeeting(dummyPayload);
            return zoomUserMeeting;
        } catch (error) {
            logger.error(error, "Failed to create the zoom meeting");
            console.log(error, "Failed to create the zoom meeting");
            throw new Error('Failed to create zoom user meeting. Please try again.');
        }
    }

    async getZoomUserMeetings(userId: string) {
        try {
            const zoomUserMeetings = await this.client.getUserMeetings(userId);
            return zoomUserMeetings;
        } catch (error) {
            logger.error(error, "Failed to get the zoom user meetings");
            console.log(error, "Failed to get the zoom user meetings");
        }
    }
}

export const zoomService = new ZoomService();