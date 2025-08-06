import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '~/database.types';

type Client = SupabaseClient<Database>;

import { CLASSES_TABLE, SESSIONS_TABLE } from '~/lib/db-tables';
import { DbClassType, InsertClassData, UpdateClassData } from '../types/class-v2';
import { DatabaseError } from '~/lib/shared/errors';
import { failure, Result, success } from '~/lib/shared/result';
import getLogger from '~/core/logger';

const logger = getLogger();

export async function createClass(client: Client, data: InsertClassData): Promise<Result<DbClassType, DatabaseError>> {
  try {
    const { data: insertedClass, error } = await client
      .from(CLASSES_TABLE)
      .insert(data)
      .select()
      .throwOnError()
      .single();

    if (error) {
      logger.error("Failed to create the class in the database", error);
      return failure(new DatabaseError("Failed to create the class in the database"));
    }

    return success(insertedClass);

  } catch (error) {
    logger.error("Something went wrong while creating the class", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
    return failure(new DatabaseError("Something went wrong while creating the class"));
  }
}

export async function getClassById(client: Client, classId: string) {
  try {
    const { data: classData, error } = await client
      .from(CLASSES_TABLE)
      .select('*')
      .eq('id', classId)
      .single();

    if (error) throw error;

    return classData;
  } catch (error) {
    console.error("Error getting class by ID:", error);
    throw new Error("Failed to get class by ID. Please try again.");
  }
}

export async function updateClass(client: Client, classId: string, data: UpdateClassData): Promise<Result<DbClassType, DatabaseError>> {
  try {
    const { data: updatedClass, error } = await client
      .from(CLASSES_TABLE)
      .update(data)
      .eq('id', classId)
      .select()
      .throwOnError()
      .single();

    if (error) {
      logger.error("Failed to update the class in the database", error);
      return failure(new DatabaseError("Failed to update the class in the database"));
    }

    return success(updatedClass);

  } catch (error) {
    logger.error("Something went wrong while updating the class", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
    return failure(new DatabaseError("Something went wrong while updating the class"));
  }
}

// export async function createClass(client: Client, data: NewClassData) {
//   try {
//     const { data: insertedClass, error } = await client
//       .from(CLASSES_TABLE)
//       .insert({
//         name: data.name,
//         subject: data.subject,
//         description: data.description,
//         grade: data.yearGrade,
//         fee: parseInt(data.monthlyFee),
//         starting_date: data.startDate,
//         time_slots: data.timeSlots.map((slot) => ({
//           day: slot.day,
//           startTime: slot.startTime,
//           endTime: slot.endTime,
//           timezone: slot.timezone 
//         })),
//         status: 'active',
//         tutor_id: data.tutorId
//       })
//       .select()
//       .throwOnError()
//       .single();

//     if (error) throw error;

//     console.log("Class created successfully:", insertedClass);

//     return insertedClass;
//   } catch (error) {
//     console.error("Error creating class:", error);
//     throw new Error("Failed to create class. Please try again.");
//   }
// }

// export async function updateClass(client: Client, classId: string, data: Partial<Omit<ClassType, 'id'>>) {
//   try {
//     const { data: updatedClass, error } = await client
//       .from(CLASSES_TABLE)
//       .update(data)
//       .eq('id', classId)
//       .select('id')
//       .throwOnError()
//       .single();

//     if (error) throw error;

//     return updatedClass;
//   } catch (error) {
//     console.error("Error updating class:", error);
//     throw new Error("Failed to update class. Please check the input fields and try again.");
//   }
// }

export async function deleteClass(client: Client, classId: string): Promise<Result<string, DatabaseError>> {
  try {
    const currentTime = new Date().toISOString();

    const { error: sessionDeleteError } = await client
      .from(SESSIONS_TABLE)
      .delete()
      .eq('class_id', classId)
      .gt('start_time', currentTime);

    if (sessionDeleteError) {
      logger.error('Failed to delete future sessions for class', { 
        classId, 
        error: sessionDeleteError 
      });
      return failure(new DatabaseError('Failed to delete future sessions for class'));
    }

    const { error: classUpdateError } = await client
      .from(CLASSES_TABLE)
      .update({ status: 'canceled' })
      .eq('id', classId);

    if (classUpdateError) {
      logger.error('Failed to update class status to canceled', { 
        classId, 
        error: classUpdateError 
      });
      return failure(new DatabaseError('Failed to update class status to canceled'));
    }

    logger.info('Class deleted successfully', { classId });
    return success(classId);
  } catch (error) {
    logger.error('Something went wrong while deleting class', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      classId,
    });
    return failure(new DatabaseError('Something went wrong while deleting class'));
  }
}











// /**
//  * @description Creates a new class
//  * @param client - Supabase client instance
//  * @param data - Class data (excluding the ID)
//  */
// export async function createClass(client: Client, data: Omit<ClassType, 'id'>) {
//   try {
//     const { data: insertedClass, error } = await client
//       .from(CLASSES_TABLE)
//       .insert({
//         name: data.name,
//         description: data.description,
//         subject: data.subject,
//         tutor_id: data.tutorId,
//         fee: data.fee,
//         time_slots: data.timeSlots?.map((slot) => ({
//           day: slot.day,
//           time: slot.time,
//           duration: slot.duration,
//           reccurringPattern: slot.reccurringPattern,
//         })),
//       })
//       .select('id')
//       .throwOnError()
//       .single();

//     if (error) throw error; // Manually throw error if any

//     return insertedClass;
//   } catch (error) {
//     console.error("Error creating class:", error);
//     throw new Error("Failed to create class. Please try again.");
//   }
// }

// /**
//  * @description Updates an existing class by ID
//  * @param client - Supabase client instance
//  * @param classId - ID of the class to update
//  * @param data - Class data to update (can be partial)
//  */
// export async function updateClass(client: Client, classId: string, data: Partial<Omit<ClassType, 'id'>>) {
//   try {
//     const { data: updatedClass, error } = await client
//       .from(CLASSES_TABLE)
//       .update(data)
//       .eq('id', classId)
//       .select('id') // Return the class ID after the update
//       .throwOnError()
//       .single();

//     if (error) throw error; // Manually throw error if any

//     return updatedClass;
//   } catch (error) {
//     console.error("Error updating class:", error);
//     throw new Error("Failed to update class. Please check the input fields and try again.");
//   }
// }

// /**
//  * @description Deletes a class by ID
//  * @param client - Supabase client instance
//  * @param classId - ID of the class to delete
//  */
// export async function deleteClass(client: Client, classId: string) {
//   try {
//     const { data, error } = await client
//       .from(CLASSES_TABLE)
//       .delete()
//       .eq('id', classId) // Filter by classId
//       .select('id') // Return the class ID after the update
//       .throwOnError();

//     if (error) throw error; // Manually throw error if any

//     return data;
//   } catch (error) {
//     console.error("Error deleting class:", error);
//     throw new Error("Failed to delete class. Please try again.");
//   }
// }
