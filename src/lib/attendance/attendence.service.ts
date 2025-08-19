import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "~/database.types";
import { Logger } from "pino";
import { insertZoomCustomerKeyMapping, insertStudentSessionAttendance } from "./database/mutations";
import { getSessionAndUserByCustomerKey } from "./database/queries";
import { failure, success, Result } from "../shared/result";
import { ServiceError } from "../shared/errors";
import { DBZoomCustomerKeyMapping, DBStudentSessionAttendance } from "./types";
import { ZoomWebhookEvent } from "../zoom/v2/types";

export class AttendanceService {
    private readonly client: SupabaseClient<Database>;
    private logger: Logger;

    constructor(client: SupabaseClient<Database>, logger: Logger) {
        this.client = client;
        this.logger = logger;
    }

    async generateZoomCustomerKeyMapping(sessionId: string, userId: string): Promise<Result<DBZoomCustomerKeyMapping, ServiceError>> {
        try {
            this.logger.info("Generating zoom customer key mapping", { sessionId, userId });

            const result = await insertZoomCustomerKeyMapping(this.client, sessionId, userId);

            if (!result.success) {
                this.logger.error("Failed to insert zoom customer key mapping", {
                    error: result.error instanceof Error ? result.error.message : String(result.error),
                    sessionId,
                    userId,
                });
                return failure(new ServiceError(result.error.message));
            }

            this.logger.info("Successfully generated zoom customer key mapping", {
                customerKey: result.data.customer_key,
                sessionId,
                userId,
            });

            return success(result.data);
        } catch (error) {
            this.logger.error("Error in generateZoomCustomerKeyMapping service", {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                name: error instanceof Error ? error.name : undefined,
                sessionId,
                userId,
            });
            return failure(new ServiceError("Failed to generate zoom customer key mapping"));
        }
    }

    async markStudentAttendance(customerKey: string, webhookPayload: ZoomWebhookEvent): Promise<Result<DBStudentSessionAttendance, ServiceError>> {
        try {
            // Type narrowing: ensure we're dealing with participant_left event
            if (webhookPayload.event !== 'meeting.participant_left') {
                this.logger.error("Invalid webhook event type for attendance marking", { 
                    event: webhookPayload.event,
                    customerKey,
                });
                return failure(new ServiceError("Invalid webhook event type"));
            }

            this.logger.info("Marking student attendance", { 
                customerKey,
                meetingId: webhookPayload.payload.object.id,
                participantName: webhookPayload.payload.object.participant.user_name,
            });

            const lookupResult = await getSessionAndUserByCustomerKey(this.client, customerKey);
            if (!lookupResult.success) {
                if (lookupResult.error.message === 'Customer key not found') {
                    this.logger.info("Customer key not found, skipping attendance marking", { customerKey });
                    return failure(new ServiceError("Customer key not found"));
                }
                this.logger.error("Failed to lookup session and user by customer key", {
                    error: lookupResult.error.message,
                    customerKey,
                });
                return failure(new ServiceError(lookupResult.error.message));
            }

            const { session_id, user_id, user_email } = lookupResult.data;

            const participant = webhookPayload.payload.object.participant;
            const meeting = webhookPayload.payload.object;

            const attendanceData: Omit<DBStudentSessionAttendance, "id" | "created_at"> = {
                session_id,
                student_id: user_id,
                email: user_email || participant.email || null,
                name: participant.user_name || null,
                join_time: meeting.start_time, // Use meeting start_time as join_time
                leave_time: participant.leave_time,
                time: null, // Right now we are not calculating the time
            };

            const attendanceResult = await insertStudentSessionAttendance(this.client, attendanceData);
            if (!attendanceResult.success) {
                this.logger.error("Failed to insert/update student session attendance", {
                    error: attendanceResult.error.message,
                    customerKey,
                    sessionId: session_id,
                    userId: user_id,
                });
                return failure(new ServiceError(attendanceResult.error.message));
            }

            this.logger.info("Successfully marked student attendance", {
                customerKey,
                attendanceRecordId: attendanceResult.data.id,
                sessionId: session_id,
                userId: user_id,
                email: attendanceData.email,
                name: attendanceData.name,
                joinTime: attendanceData.join_time,
                leaveTime: attendanceData.leave_time,
            });

            return success(attendanceResult.data);
        } catch (error) {
            this.logger.error("Error in markStudentAttendance service", {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                name: error instanceof Error ? error.name : undefined,
                customerKey,
            });
            return failure(new ServiceError("Failed to mark student attendance"));
        }
    }

}

