'use server';

import { withSession } from '~/core/generic/actions-utils';
import { zoomService } from '../zoom/zoom.service';


type JoinMeetingAsHostParams = {
  meetingId: string
};

type JoinMeetingAsStudentParams = {
    meetingId: string;
    studentData: {
        first_name: string;
        last_name: string;
        email: string;
    }
};

export const joinMeetingAsHost = withSession(
  async (params: JoinMeetingAsHostParams) => {
    const response = await zoomService.joinMeetingAsHost(params.meetingId);
    
    return {
      success: true,
      start_url: response.start_url,
    };
  }
);

export const joinMeetingAsStudent = withSession(
    async (params: JoinMeetingAsStudentParams) => {
      const response = await zoomService.joinMeetingAsStudent(params.meetingId, params.studentData);
      
      return {
        success: true,
        start_url: response.start_url,
      };
    }
);