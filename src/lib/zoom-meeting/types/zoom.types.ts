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
  id: number;
  host_id: string;
  topic: string;
  type: number;
  status: string;
  start_time: string;
  duration: number;
  timezone: string;
  created_at: string;
  join_url: string;
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
