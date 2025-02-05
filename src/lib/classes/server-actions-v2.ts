'use server';

import { revalidatePath } from 'next/cache';
import { createClass, deleteClass, updateClass } from '~/lib/classes/database/mutations-v2';
import { withSession } from '~/core/generic/actions-utils';
import getSupabaseServerActionClient from '~/core/supabase/action-client';
import { ClassType, NewClassData } from './types/class-v2';
import { getNextNOccurrences } from '../utils/date-utils';
import { zoomVideoService, ZoomVideoService } from '../zoom-meeting/video-sdk.service';

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

export const createClassAction = withSession(
  async (params: CreateClassParams) => {
    const { classData, csrfToken } = params;
    const client = getSupabaseServerActionClient();
    const zoomService = new ZoomVideoService();

    const classResult = await createClass(client, classData);
    
    // Get tutor's email for Zoom meeting setup
    const { data: tutorData } = await client
      .from('users')
      .select('email')
      .eq('id', classData.tutorId)
      .single();
    
    // Generate initial 4 sessions per time slot
    const initialSessions = await Promise.all(classData.timeSlots.flatMap(async timeSlot => {
      const nextOccurrences = getNextNOccurrences(timeSlot, classData.startDate, 4);
      
      // return nextOccurrences.map(occurrence => {
      //   const endTime = new Date(occurrence);
      //   endTime.setHours(endTime.getHours() + 2);

      //   return {
      //     class_id: classResult.id,
      //     start_time: occurrence.toISOString(),
      //     end_time: endTime.toISOString()
      //   };
      // });
      return Promise.all(nextOccurrences.map(async occurrence => {
        const endTime = new Date(occurrence);
        endTime.setHours(endTime.getHours() + 2);

        // Initialize Zoom session
        const zoomSession = await zoomVideoService.initializeSession({
          sessionName: `${classData.name}_${occurrence.toISOString()}`,
          startTime: occurrence.toISOString(),
          duration: 120, // 2 hours
          tutorId: classData.tutorId,
          className: classData.name
        });

        if (!zoomSession.success) {
          throw new Error('Failed to initialize Zoom session');
        }

        return {
          class_id: classResult.id,
          start_time: occurrence.toISOString(),
          end_time: endTime.toISOString(),
          zoom_session_name: zoomSession.sessionName,
          zoom_host_token: zoomSession.hostToken,
          zoom_participant_token: zoomSession.participantToken
        };
      }));
    }));

    // Insert all initial sessions
    const { error: sessionError } = await client
      .from('sessions')
      .insert(initialSessions.flat());

    if (sessionError) throw sessionError;

    revalidatePath('/classes');
    revalidatePath('/(app)/classes');
    
    return {
      success: true,
      class: classResult,
    };
  }
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
  }
);

export const deleteClassAction = withSession(
  async (params: DeleteClassParams) => {
    const client = getSupabaseServerActionClient();

    const result = await deleteClass(client, params.classId);

    revalidatePath('/classes');
    revalidatePath('/(app)/classes');
    
    return {
      success: true,
      classId: result,
    };
  }
);