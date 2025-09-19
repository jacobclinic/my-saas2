import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "~/database.types";
import { CreateClassPayload, DbClassType, UpdateClassData, TimeSlot } from "./types/class-v2";
import { createClass, updateClass, deleteClass } from "./database/mutations-v2";
import { failure, success } from "../shared/result";
import { Logger } from "pino";
import { ServiceError } from "../shared/errors";
import { getClassById } from "./database/queries";
import { isAdminOrCLassTutor } from "../user/database/queries";
import { updateClassShortUrl } from "./database/mutations-v2";
import { Result } from "../shared/result";
import { ZoomService } from "../zoom/v2/zoom.service";
import { UpstashService } from "../upstash/upstash.service";
import { isEqual } from "../utils/lodash-utils";

export class ClassService {

    private supabaseClient: SupabaseClient<Database>;
    private logger: Logger;
    private zoomService: ZoomService;
    private upstashService: UpstashService;

    constructor(supabaseClient: SupabaseClient<Database>, logger: Logger) {
        this.supabaseClient = supabaseClient;
        this.logger = logger;
        this.zoomService = new ZoomService(supabaseClient);
        this.upstashService = UpstashService.getInstance(logger);
    }

    async createClass(classData: CreateClassPayload) {
        try {
            const result = await createClass(this.supabaseClient, classData);
            if (!result.success) {
                this.logger.error("Failed to create the class in the database", {
                    error: result.error instanceof Error ? result.error.message : String(result.error),
                    stack: result.error instanceof Error ? result.error.stack : undefined,
                    name: result.error instanceof Error ? result.error.name : undefined,
                });
                return failure(new ServiceError(result.error.message));
            }
            this.logger.info("Class created successfully", { classData: result.data });
            return success(result.data);
        } catch (error) {
            this.logger.error("Something went wrong while creating the class", {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                name: error instanceof Error ? error.name : undefined,
            });
            return failure(new ServiceError("Something went wrong while creating the class"));
        }
    }

    async updateClass(classId: string, classData: UpdateClassData, originalClass?: DbClassType) {
        try {
            // If originalClass is not provided, fetch it from the database
            if (!originalClass) {
                const originalClassResult = await getClassById(this.supabaseClient, classId);
                if (!originalClassResult.success) {
                    this.logger.error("Failed to get the original class from the database", {
                        error: originalClassResult.error instanceof Error ? originalClassResult.error.message : String(originalClassResult.error),
                    });
                    return failure(new ServiceError(originalClassResult.error.message));
                }
                originalClass = originalClassResult.data;
            }
            
            const updateClassPayload: UpdateClassData = {
                description: classData.description || originalClass.description,
                fee: classData.fee || originalClass.fee,
                grade: classData.grade || originalClass.grade,
                name: classData.name || originalClass.name,
                starting_date: classData.starting_date || originalClass.starting_date,
                status: classData.status || originalClass.status,
                subject: classData.subject || originalClass.subject,
                time_slots: classData.time_slots || originalClass.time_slots,
            }
            const result = await updateClass(this.supabaseClient, classId, updateClassPayload);
            if (!result.success) {
                this.logger.error("Failed to update the class in the database", {
                    error: result.error instanceof Error ? result.error.message : String(result.error),
                    stack: result.error instanceof Error ? result.error.stack : undefined,
                    name: result.error instanceof Error ? result.error.name : undefined,
                });
                return failure(new ServiceError(result.error.message));
            }
            this.logger.info("Class updated successfully", { classData: result.data });
            return success(result.data);
        } catch (error) {
            this.logger.error("Something went wrong while updating the class", {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                name: error instanceof Error ? error.name : undefined,
            });
            return failure(new ServiceError("Something went wrong while updating the class"));
        }
    }

    async getClassById(classId: string) {
        try {
            const result = await getClassById(this.supabaseClient, classId);
            if (!result.success) {
                this.logger.error("Failed to get the class from the database", {
                    error: result.error instanceof Error ? result.error.message : String(result.error),
                    stack: result.error instanceof Error ? result.error.stack : undefined,
                    name: result.error instanceof Error ? result.error.name : undefined,
                });
                return failure(new ServiceError(result.error.message));
            }
            this.logger.info("Class fetched successfully", { classData: result.data });
            return success(result.data);
        } catch (error) {
            this.logger.error("Something went wrong while getting the class from the database", {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                name: error instanceof Error ? error.name : undefined,
            });
                    return failure(new ServiceError("Something went wrong while getting the class from the database"));
        }
    }

    async deleteClass(classId: string, userId: string) {
        try {
            // Check user role and permissions
            const havePermission = await isAdminOrCLassTutor(this.supabaseClient, userId, classId);
            if (!havePermission) {
                this.logger.error('User does not have permission to delete class', { userId, classId });
                return failure(new ServiceError('You don\'t have permissions to delete the class'));
            }
            
            const result = await deleteClass(this.supabaseClient, classId);
            
            if (!result.success) {
                this.logger.error('Failed to delete class', { 
                    error: result.error instanceof Error ? result.error.message : String(result.error),
                    stack: result.error instanceof Error ? result.error.stack : undefined,
                    name: result.error instanceof Error ? result.error.name : undefined,
                    classId 
                });
                return failure(new ServiceError(result.error.message));
            }
            
            this.logger.info('Class deleted successfully', { classId: result.data });
            return success(result.data);
        } catch (error) {
            this.logger.error('Service error while deleting class', { 
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                name: error instanceof Error ? error.name : undefined,
                classId 
            });
            return failure(new ServiceError('Failed to delete class'));
        }
    }

    async updateClassShortUrl(classId: string, shortUrlCode: string): Promise<Result<void>> {
        try {
            const result = await updateClassShortUrl(this.supabaseClient, classId, shortUrlCode);
            if (!result.success) {
                this.logger.error('Failed to update class short URL', { 
                    classId, 
                    shortUrlCode,
                    error: result.error instanceof Error ? result.error.message : String(result.error)
                });
                return failure(new ServiceError(result.error.message));
            }
            
            this.logger.info('Class short URL updated successfully', { classId, shortUrlCode });
            return success(undefined);
        } catch (error) {
            this.logger.error('Error updating class short URL', {
                error: error instanceof Error ? error.message : String(error),
                classId,
                shortUrlCode
            });
            return failure(new ServiceError('Error updating class short URL'));
        }
    }

    /**
     * Updates class with immediate response and background processing for heavy operations
     */
    async updateClassWithBackgroundProcessing(
        classId: string,
        classData: UpdateClassData,
        originalClass: DbClassType,
        userId: string
    ): Promise<Result<{ message?: string; queuedOperations?: boolean }>> {
        try {
            // ✅ IMMEDIATE: Update class data
            const updateClassResult = await this.updateClass(classId, classData, originalClass);
            if (!updateClassResult.success) {
                return failure(new ServiceError(updateClassResult.error.message));
            }

            // Check if time slots changed
            if (!isEqual(originalClass.time_slots, classData.time_slots)) {
                this.logger.info(`Time slots changed for class ${classId}, processing update`);

                // ✅ IMMEDIATE: Create Zoom meeting for first session if within cron window
                const firstSessionZoomResult = await this.zoomService.createZoomMeetingForFirstSessionIfNeeded(classId);
                if (firstSessionZoomResult.success && firstSessionZoomResult.data) {
                    this.logger.info(`First session Zoom meeting created for class ${classId}`, {
                        sessionId: firstSessionZoomResult.data.sessionId,
                        meetingId: firstSessionZoomResult.data.meetingId
                    });
                } else if (!firstSessionZoomResult.success) {
                    this.logger.warn(`Failed to create first session Zoom meeting for class ${classId}`, {
                        error: firstSessionZoomResult.error
                    });
                }

                // ✅ BACKGROUND: Queue heavy operations (session recreation + notifications)
                const queueResult = await this.upstashService.publishToUpstash({
                    url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/public/class/async-update`,
                    body: {
                        classId,
                        originalTimeSlots: originalClass.time_slots,
                        newTimeSlots: classData.time_slots,
                        startingDate: originalClass.starting_date,
                        newStartingDate: classData.starting_date,
                        className: updateClassResult.data.name,
                        operation: 'recreate_sessions_and_notify',
                        requestedAt: new Date().toISOString(),
                        userId
                    },
                    retries: 3
                });

                if (queueResult.success) {
                    this.logger.info(`Background processing queued for class ${classId}`, {
                        messageId: queueResult.data.messageId
                    });
                    return success({
                        message: 'Class updated successfully. Sessions are being recreated in the background.',
                        queuedOperations: true
                    });
                } else {
                    this.logger.error(`Failed to queue background processing for class ${classId}`, {
                        error: queueResult.error
                    });
                    return failure(new ServiceError('Failed to queue background processing'));
                }
            }

            return success({ message: 'Class updated successfully.' });
        } catch (error) {
            this.logger.error('Error in updateClassWithBackgroundProcessing', {
                error: error instanceof Error ? error.message : String(error),
                classId
            });
            return failure(new ServiceError('Failed to update class'));
        }
    }
}