'use server';

import { revalidatePath } from 'next/cache';
import {
  createClass,
  deleteClass,
  updateClass,
} from '~/lib/classes/database/mutations-v2';
import { withSession } from '~/core/generic/actions-utils';
import getSupabaseServerActionClient from '~/core/supabase/action-client';
import { ClassType, NewClassData } from './types/class-v2';
import { getUpcomingOccurrences, getUpcomingOccurrencesForYear } from '../utils/date-utils';
import { zoomService } from '../zoom/zoom.service';
import { CLASSES_TABLE, SESSIONS_TABLE, USERS_TABLE } from '../db-tables';
import verifyCsrfToken from '~/core/verify-csrf-token';
import { isAdminOrCLassTutor } from './database/queries';
import { getAllUpcommingSessionsData } from '../sessions/database/queries';

type CreateClassParams = {
  classData: NewClassData;
  csrfToken: string;
};

type UpdateClassParams = {
  classId: string;
  classData: Partial<Omit<ClassType, 'id'>>;
  csrfToken: string;
};

type DeleteClassParams = {
  classId: string;
  csrfToken: string;
};

// export const createClassAction1 = withSession(
//   async (params: CreateClassParams) => {
//     const { classData, csrfToken } = params;
//     const client = getSupabaseServerActionClient();

//     const classResult = await createClass(client, classData);

//     // Get tutor's email for Zoom meeting setup
//     const { data: tutorData } = await client
//       .from('users')
//       .select('email')
//       .eq('id', classData.tutorId)
//       .single();

//     // Generate initial 4 sessions per time slot
//     const initialSessions = await Promise.all(
//       classData.timeSlots.flatMap(async (timeSlot) => {
//         const nextOccurrences = getUpcomingOccurrencesForMonth(
//           timeSlot,
//           classData.startDate,
//         );

//         // return nextOccurrences.map(occurrence => {
//         //   const endTime = new Date(occurrence);
//         //   endTime.setHours(endTime.getHours() + 2);

//         //   return {
//         //     class_id: classResult.id,
//         //     start_time: occurrence.toISOString(),
//         //     end_time: endTime.toISOString()
//         //   };
//         // });
//         // Usage
//         const meetings = await createZoomMeetingsBatch(
//           classResult?.id,
//           classData,
//           nextOccurrences,
//         );
//         return meetings;
//       }),
//     );

//     // Insert all initial sessions
//     const { error: sessionError } = await client
//       .from('sessions')
//       .insert(initialSessions.flat());

//     if (sessionError) throw sessionError;

//     revalidatePath('/classes');
//     revalidatePath('/(app)/classes');

//     return {
//       success: true,
//       class: classResult,
//     };
//   },
// );

export const createClassAction = withSession(
  async (params: CreateClassParams) => {
    const { classData, csrfToken } = params;
    const client = getSupabaseServerActionClient();

    // Create the class
    const classResult = await createClass(client, classData);

    // Get tutor's email (for Zoom meeting setup)
    const { data: tutorData } = await client
      .from('users')
      .select('email')
      .eq('id', classData.tutorId)
      .single();

    // Generate initial sessions for the month and create one Zoom meeting per time slot
    const initialSessions = await Promise.all(
      classData.timeSlots.map(async (timeSlot) => {
        // Get all upcoming occurrences for the month
        const nextOccurrences = getUpcomingOccurrences(
          timeSlot,
          classData.startDate,
          new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0],
        );

        // Take the first occurrence for Zoom meeting creation
        const firstOccurrence = nextOccurrences[0];

        // Create a single Zoom meeting for the first occurrence
        const zoomMeeting = await createZoomMeeting(
          classResult?.id,
          {
            name: classData.name || 'Class',
            subject: classData.subject || 'Subject',
            description: classData.description || 'Description',
            yearGrade: classData.yearGrade || '',
            monthlyFee: classData.monthlyFee || '',
            startDate: classData.startDate || '',
            timeSlots: [timeSlot],
            tutorId: classData.tutorId || '',
          },
          {
            startTime: new Date(firstOccurrence.startTime),
            endTime: new Date(firstOccurrence.endTime),
          },
        );

        // Map all occurrences to session objects, with only the first having a meeting_url
        const sessions = nextOccurrences.map((occurrence, index) => ({
          class_id: classResult?.id,
          start_time: new Date(occurrence.startTime).toISOString(),
          end_time: new Date(occurrence.endTime).toISOString(),
          meeting_url: index === 0 ? zoomMeeting?.zoomMeeting.join_url : '', // Only first session gets the Zoom URL
          zoom_meeting_id: zoomMeeting?.zoomMeeting.id,
          status: 'scheduled',
          created_at: new Date().toISOString(),
        }));

        return sessions;
      }),
    );

    // Insert all initial sessions into the database
    const { error: sessionError } = await client
      .from(SESSIONS_TABLE)
      .insert(initialSessions.flat());

    if (sessionError) throw sessionError;

    // Revalidate paths
    revalidatePath('/classes');
    revalidatePath('/(app)/classes');

    return {
      success: true,
      class: classResult,
    };
  },
);

export const updateClassAction = withSession(
  async (params: UpdateClassParams) => {
    const client = getSupabaseServerActionClient();

    const result = await updateClass(client, params.classId, params.classData);

    revalidatePath('/classes');
    revalidatePath(`/classes/${result?.id}`);
    revalidatePath('/(app)/classes');

    return {
      success: true,
      class: result,
    };
  },
);

export const deleteClassAction = withSession(
  async (params: DeleteClassParams) => {
    const { classId, csrfToken } = params;
    const client = getSupabaseServerActionClient();

    await verifyCsrfToken(csrfToken);

    // Get the current user's session
    const {
      data: { session },
      error: sessionError,
    } = await client.auth.getSession();
    if (sessionError || !session?.user) {
      return {
        success: false,
        error: 'User not authenticated',
      };
    }

    const userId = session.user.id;

    // Check user role and permissions
    const havePermission = await isAdminOrCLassTutor(client, userId, classId)
    if(!havePermission){
      return {
        success: false,
        error: `You don't have permissions to delete the class`,
      };
    }
    //Proceed with class deletion
    const result = await deleteClass(client, classId);
    if (!result) {
      return {
        success: false,
        error: 'Failed to delete class',
      };
    }

    //Revalidate paths
    revalidatePath('/classes');
    revalidatePath('/(app)/classes');

    return {
      success: true,
      classId: result,
    };
  }
);
const createZoomMeetingsBatch = async (
  classId: string,
  classData: NewClassData,
  occurrences: { startTime: Date; endTime: Date }[],
) => {
  const results = [];

  for (let i = 0; i < occurrences.length; i++) {
    const occurrence = occurrences[i];

    const start_time = occurrence.startTime.toISOString();
    const end_time = occurrence.endTime.toISOString();

    try {
      // Create Zoom meeting
      const zoomMeeting = await zoomService.createMeeting(
        {
          topic: `${classData.name}_${start_time}`,
          start_time,
          duration:
            (new Date(occurrence.endTime).getTime() -
              new Date(occurrence.startTime).getTime()) /
            (1000 * 60),
          timezone: 'Asia/Colombo',
          type: 2,
        },
        '',
      );

      if (!zoomMeeting) {
        throw new Error('Failed to initialize Zoom session');
      }

      results.push({
        class_id: classId,
        start_time,
        end_time,
        zoom_meeting_id: zoomMeeting?.id,
      });

      // Introduce a delay after every 9 requests
      if ((i + 1) % 9 === 0) {
        console.log('Rate limit reached, waiting for 1 second...');
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 1-second delay
      }
    } catch (error) {
      console.error(
        `Error creating Zoom meeting for occurrence ${i + 1}:`,
        error,
      );
    }
  }

  return results;
};

export const createZoomMeeting = async (
  classId: string,
  classData: NewClassData,
  occurrence: { startTime: Date; endTime: Date },
) => {
  const start_time = occurrence.startTime.toISOString();
  const end_time = occurrence.endTime.toISOString();
  try {
    // Create Zoom meeting
    const zoomMeeting = await zoomService.createMeeting(
      {
        topic: `${classData.name}_${start_time}`,
        start_time,
        duration:
          (new Date(occurrence.endTime).getTime() -
            new Date(occurrence.startTime).getTime()) /
          (1000 * 60),
        timezone: 'Asia/Colombo',
        type: 2,
      },
      '',
    );
    if (!zoomMeeting) {
      throw new Error('Failed to initialize Zoom session');
    }
    return {
      zoomMeeting: zoomMeeting,
      class_id: classId,
      start_time,
      end_time,
      zoom_meeting_id: zoomMeeting?.id,
    };
  } catch (error) {
    console.error(`Error creating Zoom meeting`, error);
  }
};

export const getAllUpcominSessionsAdmin = async() =>{
  const client = getSupabaseServerActionClient();
  const {
    data: { session },
    error: sessionError,
  } = await client.auth.getSession();
  if (sessionError || !session?.user) {
    throw new Error('User not authenticated');
  }

  const userId = session.user.id;

  // Check user role and permissions
  const { data: userProfile, error: profileError } = await client
    .from(USERS_TABLE) 
    .select('user_role')
    .eq('id', userId)
    .single();

  if (profileError || !userProfile) {
    throw new Error('Failed to fetch user profile');
  }

  const isAdmin = userProfile.user_role === 'admin';

  if (!isAdmin) {
    throw new Error('Unauthorized to access this data');
  }

  const data =  await getAllUpcommingSessionsData(client)
  if (!data) {
    throw new Error('Failed to fetch upcoming sessions data');
  }
  return data;
}
