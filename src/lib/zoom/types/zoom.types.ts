// Types for Zoom API responses and requests

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

export interface ZoomMeetingResponse {
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

export interface ZoomTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export interface UpdateSessionMeetingRequest {
  sessionId: string;
  startTime: string;
  endTime: string;
  title?: string;
}

// Type definitions for Zoom webhook payload (simplified)
export interface ZoomWebhookPayload {
  event: string;
  payload: {
    object: {
      id: string; // meetingId
      recording_files: {
        id: string;
        file_type: string;
        download_url: string;
      }[];
    };
    plainToken?: string; // For URL validation
  };
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