import { SupabaseClient } from "@supabase/supabase-js";
import { Logger } from "pino";
import { Database } from "~/database.types";
import { failure, Result, success } from "../shared/result";
import { DatabaseError, ServiceError } from "../shared/errors";
import { generateWeeklyOccurrences, RecurrenceInput } from "../utils/recurrence-utils";
import { TimeSlot } from "../classes/types/class-v2";
import { createMultipleRecurringSessions, deleteSessions, updateSessionAsync } from "./database/mutations";
import { InsertSessionData } from "./types/session-v2";
import { getNextSessionByClassID, getSessionById } from "./database/queries";
import type { UpcomingSession, UpdateSessionData } from "./types/session-v2";
import { getZoomSessionByZoomMeetingId } from "../zoom_sessions/database/queries";

type Client = SupabaseClient<Database>;

export class SessionService {
    private supabaseClient: Client;
    private logger: Logger;

    constructor(supabaseClient: Client, logger: Logger) {
        this.supabaseClient = supabaseClient;
        this.logger = logger;
    }

    async createRecurringSessions(classId: string, timeSlots: TimeSlot[], startDate: string): Promise<Result<InsertSessionData[], DatabaseError>> {
        try {
            if (!classId || !timeSlots || timeSlots.length === 0 || !startDate) {
                this.logger.error("Invalid parameters for creating recurring sessions", {
                    classId,
                    timeSlots,
                    startDate
                });
                return failure(new ServiceError("Invalid parameters for creating recurring sessions"));
            }
            const occurrences = [];
            const yearEndDate = new Date(new Date().getFullYear(), 11, 31)
                .toISOString()
                .split('T')[0];
            for (const slot of timeSlots) {
                const recurrenceInputPayload: RecurrenceInput = {
                    startDate: startDate,
                    endDate: yearEndDate,
                    timeSlot: slot,
                    dayOfWeek: slot.day,
                };
                const weeklyOccurences = generateWeeklyOccurrences(
                    recurrenceInputPayload,
                );
                occurrences.push(...weeklyOccurences);

            }
            const sessions = occurrences.map((occurrence, index) => ({
                class_id: classId,
                start_time: new Date(occurrence.startTime).toISOString(),
                end_time: new Date(occurrence.endTime).toISOString(),
                meeting_url: '',
                zoom_meeting_id: '',
                status: 'scheduled',
                created_at: new Date().toISOString(),
            }));

            const result = await createMultipleRecurringSessions(this.supabaseClient, sessions);
            if (!result.success) {
                this.logger.error("Failed to create the recurring sessions in the database", result.error);
                return failure(new ServiceError(result.error.message));
            }
            this.logger.info("Recurring sessions created successfully", result.data);
            return success(result.data);
        } catch (error) {
            this.logger.error("Something went wrong while creating the recurring sessions", error);
            return failure(new ServiceError("Something went wrong while creating the recurring sessions"));
        }
    }

    async deleteSessions(classId: string, startDate: string): Promise<Result<void, DatabaseError>> {
        try {
            const result = await deleteSessions(this.supabaseClient, classId, startDate);
            if (!result.success) {
                this.logger.error("Failed to delete the recurring sessions in the database", {
                    error: result.error,
                    classId,
                    startDate
                });
                return failure(new ServiceError(result.error.message));
            }
            return success(undefined);
        } catch (error) {
            this.logger.error("Something went wrong while deleting the recurring sessions", {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                name: error instanceof Error ? error.name : undefined,
            });
            return failure(new ServiceError("Something went wrong while deleting the recurring sessions"));
        }
    }

    async getNextSessionByClassId(classId: string): Promise<Result<UpcomingSession | null, DatabaseError>> {
        try {
            if (!classId) {
                this.logger.error("Invalid classId for getNextSessionByClassId", { classId });
                return failure(new ServiceError("Invalid classId"));
            }
            const data = await getNextSessionByClassID(this.supabaseClient, classId);
            return success(data ?? null);
        } catch (error) {
            this.logger.error("Failed to get next session by classId", {
                error: error instanceof Error ? error.message : String(error),
                classId,
            });
            return failure(new ServiceError("Failed to fetch next session"));
        }
    }

    async updateSessionRecodingUrls(zoomMeetingId: string, recordingUrls: string[]): Promise<Result<UpdateSessionData, DatabaseError>> {
        try {
            const zoomSession = await getZoomSessionByZoomMeetingId(this.supabaseClient, zoomMeetingId);
            const existingSession = await getSessionById(this.supabaseClient, zoomSession.session_id);
            if (existingSession) {
                const allRecordings = [...(existingSession.recording_urls ?? []), ...recordingUrls]
                const result = await updateSessionAsync(this.supabaseClient, zoomSession.session_id, { recording_urls: allRecordings });
                if (!result.success) {
                    this.logger.error("Failed to update session recording urls", result.error);
                    return failure(new ServiceError(result.error.message));
                }
                return success(result.data);
            }
            return success(existingSession);
        } catch (error) {
            this.logger.error("Failed to update session recording urls", {
                error: error instanceof Error ? error.message : String(error),
                zoomMeetingId,
                recordingUrls,
            });
            return failure(new ServiceError("Failed to update session recording urls"));
        }
    }
}