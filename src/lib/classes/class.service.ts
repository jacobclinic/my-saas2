import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "~/database.types";
import { CreateClassPayload, DbClassType, UpdateClassData } from "./types/class-v2";
import { createClass, updateClass } from "./database/mutations-v2";
import { failure, success } from "../shared/result";
import { Logger } from "pino";
import { ServiceError } from "../shared/errors";
import { getClassById } from "./database/queries";
export class ClassService {

    private supabaseClient: SupabaseClient<Database>;
    private logger: Logger;

    constructor(supabaseClient: SupabaseClient<Database>, logger: Logger) {
        this.supabaseClient = supabaseClient;
        this.logger = logger;
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
}