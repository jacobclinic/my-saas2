import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '~/database.types';

export type ZoomWebhookPayload = {
  event: string;
  payload: any;
};

interface BaseZoomWebhookPayload<T extends string, P> {
  event: T;
  payload: P;
  event_ts: number;
}

interface ZoomUrlValidationPayload {
  plainToken: string;
}

interface ZoomMeetingEndedPayload {
  account_id: string;
  operator: string;
  operator_id: string;
  operation: string;
  object: {
    id: string;
    uuid: string;
    host_id: string;
    topic: string;
    type: number;
    start_time: string;
    timezone: string;
    duration: number;
    end_time: string;
  };
}

export type ZoomWebhookEvent =
  | BaseZoomWebhookPayload<'meeting.ended', ZoomMeetingEndedPayload>
  | BaseZoomWebhookPayload<'endpoint.url_validation', ZoomUrlValidationPayload>;

export type ZoomUserType = 1 | 2 | 3; // 1=Basic, 2=Licensed, 3=On-prem
export type ZoomCreateUserAction =
  | 'create'
  | 'autoCreate'
  | 'custCreate'
  | 'ssoCreate';

export type ZoomUserFeature = {
  zoom_phone: boolean;
};

export type ZoomUserRequestInfo = {
  email: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  password?: string;
  type: ZoomUserType;
  feature?: ZoomUserFeature;
  plan_united_type?: string;
};

export type ZoomCreateUserRequest = {
  action: ZoomCreateUserAction;
  user_info: ZoomUserRequestInfo;
  tutor_id: string;
};

export type ZoomUser = {
  email: string;
  first_name: string;
  id: string;
  last_name: string;
  type: ZoomUserType;
  tutor_id: string;
};

export type CommaZoomUser = Omit<
  ZoomUser,
  'first_name' | 'last_name' | 'type'
> & {
  zoom_user_id: string;
  account_type: ZoomUserType;
};

export type ZoomCreateUserResponse = ZoomUser;

// Can extend this.
// https://developers.zoom.us/docs/api/meetings/#tag/meetings/POST/users/{userId}/meetings
export type ZoomMeetingType = 1 | 2 | 3 | 8 | 10;

export type ZoomCreateUserMeetingRequest = {
  userId: string;
  body: {
    topic: string;
    agenda: string;
    default_password: boolean;
    duration: number;
    password: string;
    pre_schedule?: boolean;
    start_time: string;
    timezone?: string;
    type?: ZoomMeetingType;
    auto_recording: 'local' | 'cloud' | 'none';
    email_notification?: boolean;
    join_before_host?: boolean;
    jbh_time?: 0 | 5 | 10 | 15;
  };
};

export type ZoomMeetingResponse = {
  id: number;
  uuid: string;
  host_email?: string;
  topic?: string;
  type?: number;
  status?: string;
  start_time?: string;
  duration?: number;
  timezone?: string;
  agenda?: string;
  created_at?: string;
  start_url: string;
  join_url: string;
  password?: string;
  h323_password?: string;
  pstn_password?: string;
  encrypted_password?: string;
  registration_url?: string;
  pmi?: string;
  creation_source?: 'other' | 'open_api' | 'web_portal';
  settings?: {
    host_video?: boolean;
    participant_video?: boolean;
    join_before_host?: boolean;
    mute_upon_entry?: boolean;
    use_pmi?: boolean;
    approval_type?: 0 | 1 | 2;
    audio?: 'both' | 'telephony' | 'voip' | 'thirdParty';
    auto_recording?: 'local' | 'cloud' | 'none';
    alternative_hosts?: string;
    waiting_room?: boolean;
    meeting_authentication?: boolean;
  };
};

export type ZoomRecordingFileType = {
  deleted_time?: string;
  download_url: string;
  file_path: string;
  file_size: number;
  file_type: string;
  file_extension?: string;
  id: string;
  meeting_id: string;
  play_url: string;
  recording_end: string;
  recording_start: string;
  recording_type?: string;
  status: string;
};

export type ZoomParticipantAudioFile = {
  download_url: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  id: string;
  play_url: string;
  recording_end: string;
  recording_start: string;
  status: string;
};

export type ZoomMeetingRecordingResponse = {
  account_id: string;
  duration: number;
  host_id: string;
  id: number;
  recording_count: number;
  start_time: string;
  topic: string;
  total_size: number;
  type: string;
  uuid: string;
  recording_play_passcode?: string;
  auto_delete?: boolean;
  auto_delete_date?: string;
  recording_files: ZoomRecordingFileType[];
  download_access_token?: string;
  password?: string;
  participant_audio_files?: ZoomParticipantAudioFile[];
};



export type ZoomMeetingRecordingUrl = {
  play_url: string;
  download_url: string;
};

export interface ZoomParticipant {
  name: string | null;
  email: string | null;
  join_time: string;
  leave_time: string;
  duration: number;
}

export interface ZoomParticipantsResponse {
  page_count: number;
  page_size: number;
  total_records: number;
  next_page_token: string;
  participants: ZoomParticipant[];
}

export interface Attendance {
  time: string | null;
  email: string | null;
  name: string | null;
  join_time: string | null;
  leave_time: string | null;
}

export interface AttendanceWithSessionId extends Attendance {
  sessionId: string;
}

export interface ZoomTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export interface ZoomRecordingResponse {
  id: string;
  recording_files: {
    id: string;
    file_type: string;
    download_url: string;
  }[];
  password?: string;
}

export interface ZoomUserRecordingsResponse {
  from: string;
  to: string;
  page_size: number;
  total_records: number;
  next_page_token: string;
  meetings: {
    uuid: string;
    id: number;
    topic: string;
    start_time: string;
    duration: number;
    recording_files: {
      id: string;
      recording_start: string;
      recording_end: string;
      file_type: string;
      file_size: number;
      download_url: string;
      status: string;
    }[];
  }[];
}

export interface ZoomMeetingSettings {
  host_video?: boolean;
  participant_video?: boolean;
  join_before_host?: boolean;
  mute_upon_entry?: boolean;
  waiting_room?: boolean;
  meeting_authentication?: boolean;
}

export interface CreateZoomMeetingRequest {
  topic: string;
  type: 2; // Scheduled meeting
  start_time: string;
  duration: number;
  timezone: string;
  password?: string;
  settings?: Partial<ZoomMeetingSettings>;
}

// Legacy ZoomMeetingResponse from old service
export interface LegacyZoomMeetingResponse {
  id: string;
  host_id: string;
  topic: string;
  type: number;
  status: string;
  start_time: string;
  duration: number;
  timezone: string;
  created_at: string;
  join_url: string;
  start_url: string;
  password?: string;
  settings: ZoomMeetingSettings;
}
