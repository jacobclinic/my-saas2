import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '~/database.types';

type Client = SupabaseClient<Database>;

import { CLASSES_TABLE, SESSIONS_TABLE } from '~/lib/db-tables';
import { ClassType, NewClassData, AdminNewClassData } from '../types/class-v2';

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
    console.error('Error getting class by ID:', error);
    throw new Error('Failed to get class by ID. Please try again.');
  }
}

export async function createClass(client: Client, data: NewClassData) {
  try {
    const { data: insertedClass, error } = await client
      .from(CLASSES_TABLE)
      .insert({
        name: data.name,
        subject: data.subject,
        description: data.description,
        grade: data.yearGrade,
        fee: parseInt(data.monthlyFee),
        starting_date: data.startDate,
        time_slots: data.timeSlots.map((slot) => ({
          day: slot.day,
          startTime: slot.startTime,
          endTime: slot.endTime,
          timezone: slot.timezone,
        })),
        status: 'active',
        tutor_id: data.tutorId,
      })
      .select()
      .throwOnError()
      .single();

    if (error) throw error;

    console.log('Class created successfully:', insertedClass);

    return insertedClass;
  } catch (error) {
    console.error('Error creating class:', error);
    throw new Error('Failed to create class. Please try again.');
  }
}

export async function createClassByAdmin(
  client: Client,
  data: AdminNewClassData,
) {
  try {
    const { data: insertedClass, error } = await client
      .from(CLASSES_TABLE)
      .insert({
        name: data.name,
        subject: data.subject,
        description: data.description,
        grade: data.yearGrade,
        fee: parseInt(data.monthlyFee),
        starting_date: data.startDate,
        time_slots: data.timeSlots.map((slot) => ({
          day: slot.day,
          startTime: slot.startTime,
          endTime: slot.endTime,
          timezone: slot.timezone,
        })),
        status: 'active',
        tutor_id: data.tutorId,
      })
      .select()
      .throwOnError()
      .single();

    if (error) throw error;

    console.log('Class created successfully by admin:', insertedClass);

    return insertedClass;
  } catch (error) {
    console.error('Error creating class by admin:', error);
    throw new Error('Failed to create class. Please try again.');
  }
}

export async function updateClass(
  client: Client,
  classId: string,
  data: Partial<Omit<ClassType, 'id'>>,
) {
  try {
    const { data: updatedClass, error } = await client
      .from(CLASSES_TABLE)
      .update(data)
      .eq('id', classId)
      .select('id')
      .throwOnError()
      .single();

    if (error) throw error;

    return updatedClass;
  } catch (error) {
    console.error('Error updating class:', error);
    throw new Error(
      'Failed to update class. Please check the input fields and try again.',
    );
  }
}

export async function deleteClass(client: Client, classId: string) {
  try {
    const currentTime = new Date().toISOString();

    const { error } = await client
      .from(SESSIONS_TABLE)
      .delete()
      .eq('class_id', classId)
      .gt('start_time', currentTime);

    if (error) throw error;

    const result = await client
      .from(CLASSES_TABLE)
      .update({ status: 'canceled' })
      .eq('id', classId);

    if (result.error) throw result.error;

    return classId;
  } catch (error) {
    console.error('Error deleting class sessions:', error);
    throw new Error('Failed to delete class sessions. Please try again.');
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
