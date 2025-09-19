import { SupabaseClient } from "@supabase/supabase-js";
import { Logger } from "pino";
import { Database } from "~/database.types";
import { failure, Result, success } from "../shared/result";
import { DatabaseError, ServiceError } from "../shared/errors";
import { generateWeeklyOccurrences, RecurrenceInput } from "../utils/recurrence-utils";
import { TimeSlot } from "../classes/types/class-v2";
import { createMultipleRecurringSessions, deleteSessions, updateSessionAsync, updateSession, updateSessionWithZoomFields } from "./database/mutations";
import { InsertSessionData } from "./types/session-v2";
import { getNextSessionByClassID, getSessionById, getSessionDataById, getSessionDataByIdWithZoomUser } from "./database/queries";
import type { UpcomingSession, UpdateSessionData } from "./types/session-v2";
import { getZoomSessionByZoomMeetingId } from "../zoom_sessions/database/queries";
import { ZoomService } from "../zoom/v2/zoom.service";
import { zoomService } from "../zoom/zoom.service";
import { createZoomSession } from "../zoom_sessions/database/mutations";
import { getStudentsByClassId } from "../notifications/queries";
import { EmailService } from "~/core/email/send-email-mailtrap";
import { getNotifyClassUpdateTemplate } from "~/core/email/templates/emailTemplate";

type Client = SupabaseClient<Database>;

export class SessionService {
    private supabaseClient: Client;
    private logger: Logger;
    private zoomService: ZoomService;

    constructor(supabaseClient: Client, logger: Logger) {
        this.supabaseClient = supabaseClient;
        this.logger = logger;
        this.zoomService = new ZoomService(supabaseClient);
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

    /**
     * Updates a session with proper Zoom meeting synchronization
     * Handles the critical case where sessions don't have Zoom meetings yet
     */
    async updateSessionWithZoomSync(params: {
        sessionId: string;
        sessionData: {
            title?: string;
            description?: string;
            startTime?: string;
            endTime?: string;
        };
    }): Promise<Result<{ warning?: string }, ServiceError>> {
        try {
            const { sessionId, sessionData } = params;

            // Get existing session with full details including zoom_user data
            const existingSession = await getSessionDataByIdWithZoomUser(this.supabaseClient, sessionId);
            if (!existingSession) {
                this.logger.error("Session not found", { sessionId });
                return failure(new ServiceError("Session not found"));
            }

            // Basic time validation is now handled in frontend
            // Additional server-side validation could be added here if needed

            // Check if time has changed
            const timeChanged = (sessionData.startTime || sessionData.endTime) &&
                ((sessionData.startTime &&
                    new Date(existingSession.start_time || '').getTime() !==
                    new Date(sessionData.startTime).getTime()) ||
                (sessionData.endTime &&
                    new Date(existingSession.end_time || '').getTime() !==
                    new Date(sessionData.endTime).getTime()));

            // Build update object with only provided fields
            const updateData: Record<string, any> = {
                updated_at: new Date().toISOString(),
            };

            if (sessionData.title !== undefined) updateData.title = sessionData.title;
            if (sessionData.description !== undefined) updateData.description = sessionData.description;
            if (sessionData.startTime !== undefined) updateData.start_time = sessionData.startTime;
            if (sessionData.endTime !== undefined) updateData.end_time = sessionData.endTime;

            // Update session in database first
            const updateResult = await updateSessionAsync(this.supabaseClient, sessionId, updateData);
            if (!updateResult.success) {
                this.logger.error("Failed to update session in database", {
                    error: updateResult.error.message,
                    sessionId,
                    updateData
                });
                return failure(new ServiceError(updateResult.error.message));
            }

            // ✅ NEW: Handle Zoom meeting synchronization with targeted approach
            if (timeChanged) {
                this.logger.info(`Date/time changed for session ${sessionId}, updating Zoom meeting`, {
                    originalStart: existingSession.start_time,
                    originalEnd: existingSession.end_time,
                    newStart: sessionData.startTime,
                    newEnd: sessionData.endTime
                });

                // Use the new targeted ZoomService method
                const zoomResult = await this.zoomService.createOrUpdateZoomMeetingForSession(sessionId);

                if (zoomResult.success) {
                    this.logger.info(`Zoom meeting ${zoomResult.data.status} for session ${sessionId}`, {
                        meetingId: zoomResult.data.meetingId
                    });
                } else {
                    this.logger.error(`Failed to manage Zoom meeting for session ${sessionId}`, {
                        error: zoomResult.error
                    });
                    return success({
                        warning: 'Session updated successfully, but there was an issue with the Zoom meeting. Please check the meeting link.'
                    });
                }
            }

            // Notify enrolled students if time changed
            if (timeChanged && existingSession.class_id) {
                try {
                    await this.notifyStudentsOfSessionUpdate({
                        sessionId,
                        classId: existingSession.class_id,
                        className: existingSession.class?.name || 'Class',
                        originalStartTime: existingSession.start_time || '',
                        newStartTime: sessionData.startTime || existingSession.start_time || '',
                        newEndTime: sessionData.endTime || existingSession.end_time || ''
                    });
                } catch (notificationError) {
                    // Don't fail the whole operation if notifications fail
                    this.logger.error("Failed to send student notifications", {
                        error: notificationError instanceof Error ? notificationError.message : String(notificationError),
                        sessionId
                    });
                }
            }

            this.logger.info("Session updated successfully", { sessionId, timeChanged });
            return success({});

        } catch (error) {
            this.logger.error("Error in updateSessionWithZoomSync", {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                params
            });
            return failure(new ServiceError("Something went wrong while updating the session"));
        }
    }

    /**
     * Creates a Zoom meeting for a session that doesn't have one
     */
    private async createZoomMeetingForSession(
        session: any,
        startTime: string,
        endTime: string,
        title: string
    ): Promise<Result<{ meetingId: string; joinUrl: string }, ServiceError>> {
        try {
            // Get tutor's zoom user ID
            if (!session.class?.tutor?.zoom_user || session.class.tutor.zoom_user.length === 0) {
                return failure(new ServiceError("Tutor does not have a valid Zoom account"));
            }

            const zoomUserId = session.class.tutor.zoom_user[0].zoom_user_id;
            const zoomService = new ZoomService(this.supabaseClient);

            const sessionStartTime = new Date(startTime);
            const sessionEndTime = new Date(endTime);
            const meetingDurationMinutes = this.getDurationInMinutes(startTime, endTime);

            // Create Zoom meeting
            const meeting = await zoomService.createZoomUserMeeting({
                userId: zoomUserId,
                body: {
                    topic: title,
                    agenda: session.description || '',
                    default_password: false,
                    duration: meetingDurationMinutes,
                    pre_schedule: false,
                    start_time: sessionStartTime.toISOString(),
                    type: 2,
                    timezone: "UTC",
                    settings: {
                        waiting_room: false,
                        meeting_authentication: false,
                        approval_type: 0,
                        join_before_host: false,
                        jbh_time: 15,
                        mute_upon_entry: true,
                        host_video: true,
                        participant_video: false,
                        auto_recording: 'cloud',
                    }
                }
            });

            // Create zoom_sessions record
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
            };

            await createZoomSession(this.supabaseClient, createZoomSessionPayload);

            return success({
                meetingId: meeting.id!.toString(),
                joinUrl: meeting.join_url
            });

        } catch (error) {
            this.logger.error("Error creating Zoom meeting for session", {
                error: error instanceof Error ? error.message : String(error),
                sessionId: session.id
            });
            return failure(new ServiceError("Failed to create Zoom meeting"));
        }
    }

    /**
     * Updates zoom_sessions table record
     */
    private async updateZoomSessionRecord(meetingId: string, updateData: {
        join_url?: string;
        start_url?: string;
        duration?: number;
        start_time?: string;
    }): Promise<void> {
        try {
            const { error } = await this.supabaseClient
                .from('zoom_sessions')
                .update(updateData)
                .eq('meeting_id', meetingId);

            if (error) {
                this.logger.error("Failed to update zoom_sessions record", { error, meetingId });
                throw new Error("Failed to update zoom_sessions record");
            }
        } catch (error) {
            this.logger.error("Error updating zoom_sessions record", {
                error: error instanceof Error ? error.message : String(error),
                meetingId
            });
            throw error;
        }
    }

    /**
     * Notifies enrolled students about session time changes
     */
    private async notifyStudentsOfSessionUpdate(params: {
        sessionId: string;
        classId: string;
        className: string;
        originalStartTime: string;
        newStartTime: string;
        newEndTime: string;
    }): Promise<void> {
        try {
            const { sessionId, classId, className, originalStartTime, newStartTime, newEndTime } = params;

            // Get enrolled students
            const enrolledStudents = await getStudentsByClassId(this.supabaseClient, classId);

            if (!enrolledStudents || enrolledStudents.length === 0) {
                this.logger.info("No enrolled students to notify", { sessionId, classId });
                return;
            }

            const emailService = EmailService.getInstance();

            // Format dates for display
            const originalDate = new Date(originalStartTime);
            const newStartDate = new Date(newStartTime);
            const newEndDate = new Date(newEndTime);

            const originalTimeStr = originalDate.toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'UTC'
            });

            const newTimeStr = `${newStartDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                timeZone: 'UTC'
            })} from ${newStartDate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'UTC'
            })} to ${newEndDate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'UTC'
            })}`;

            // Send notifications to all enrolled students
            const notificationPromises = enrolledStudents.map(async (enrollment) => {
                try {
                    const student = enrollment.student;

                    if (!student.email) {
                        this.logger.warn("Student has no email address", {
                            studentId: student.id,
                            sessionId
                        });
                        return;
                    }

                    const emailTemplate = getNotifyClassUpdateTemplate({
                        className,
                        studentName: student.first_name || 'Student',
                        firstClassDate: originalTimeStr,
                        updatedClassDay: newStartDate.toLocaleDateString('en-US', { weekday: 'long' }),
                        updatedClassTime: newTimeStr
                    });

                    await emailService.sendEmail({
                        from: process.env.EMAIL_SENDER!,
                        to: student.email,
                        subject: `Class Schedule Update: ${className}`,
                        html: emailTemplate.html,
                        text: emailTemplate.text || `Your class ${className} has been rescheduled from ${originalTimeStr} to ${newTimeStr}.`
                    });

                    this.logger.info("Sent session update notification", {
                        studentEmail: student.email,
                        sessionId,
                        className
                    });

                    // Add small delay to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 200));

                } catch (emailError) {
                    this.logger.error("Failed to send notification to student", {
                        error: emailError instanceof Error ? emailError.message : String(emailError),
                        studentId: enrollment.student.id,
                        sessionId
                    });
                }
            });

            await Promise.allSettled(notificationPromises);

            this.logger.info("Completed sending session update notifications", {
                sessionId,
                classId,
                studentCount: enrolledStudents.length
            });

        } catch (error) {
            this.logger.error("Error in notifyStudentsOfSessionUpdate", {
                error: error instanceof Error ? error.message : String(error),
                params
            });
            throw error;
        }
    }

    /**
     * Calculates duration in minutes between two ISO date strings
     */
    private getDurationInMinutes(startTime: string, endTime: string): number {
        const start = new Date(startTime);
        const end = new Date(endTime);
        return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
    }
}