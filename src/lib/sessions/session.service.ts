import { SupabaseClient } from "@supabase/supabase-js";
import { Logger } from "pino";
import { Database } from "~/database.types";
import { failure, Result, success } from "../shared/result";
import { DatabaseError, ServiceError } from "../shared/errors";
import { generateWeeklyOccurrences, RecurrenceInput } from "../utils/recurrence-utils";
import { TimeSlot } from "../classes/types/class-v2";
import { createMultipleRecurringSessions, deleteSessions } from "./database/mutations";
import { InsertSessionData } from "./types/session-v2";
import { SESSIONS_TABLE } from "../db-tables";

type Client = SupabaseClient<Database>;

export class SessionService {
    private supabaseClient: Client;
    private logger: Logger;

    constructor(supabaseClient: Client, logger: Logger) {
        this.supabaseClient = supabaseClient;
        this.logger = logger;
    }

    async createRecurringSessions(classId: string, timeSlots: TimeSlot[], startDate: string) : Promise<Result<InsertSessionData[], DatabaseError>> {
        try {
            if(!classId || !timeSlots || timeSlots.length === 0 || !startDate){
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
            if(!result.success){
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

    async deleteSessions(classId: string, startDate: string) : Promise<Result<void, DatabaseError>> {
        try {
            const result = await deleteSessions(this.supabaseClient, classId, startDate);
            if(!result.success){
                this.logger.error("Failed to delete the recurring sessions in the database",{
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
}