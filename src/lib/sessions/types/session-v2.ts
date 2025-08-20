import { Database } from "~/database.types";

interface Session {
  id: string;
  created_at: string;
  class_id: string | null;
  recording_urls: string[] | null;
  status: string | null;
  start_time: string | null;
  end_time: string | null;
  recurring_session_id: string | null;
  title: string | null;
  description: string | null;
  updated_at: string | null;
  meeting_url: string | null
  zoom_meeting_id?: string | null
  zoom_session_name?: string | null
  zoom_host_token?: string | null
  zoom_participant_token?: string | null
  attendance_marked?: boolean | null
}

interface SessionClass {
  id?: string;
  name?: string | null;
  subject?: string | null;
  tutor_id?: string;
  tutor?: {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    email: string | null;
  };
  fee?: number | null;
  students?: { id: string }[] | null;
}

interface SessionMaterial {
  id: string;
  name: string | null;
  url?: string | null;
  file_size: string | null;
}

interface UpcomingSession extends Session {
  class?: SessionClass;
  materials?: SessionMaterial[];
  payment_status?: string;
  payment_amount?: number | null;
  payment_due_date?: string | null;
}

interface PastSessionAttendanceStudent {
  id: string;
  first_name: string | null;
  last_name: string | null;
}
interface PastSession extends UpcomingSession {
  attendance?: {
    time: string | null;
    email: string | null;
    name: string | null;
    join_time: string | null;
    leave_time: string | null;
  }[];
}

interface pastSessionsForAttendance {
  id: string;
  attendance_marked: boolean;
  zoom_meeting_id: string;
}

export type { Session, UpcomingSession, PastSession, pastSessionsForAttendance };


export type InsertSessionData = Database['public']['Tables']['sessions']['Insert'];
export type UpdateSessionData = Database['public']['Tables']['sessions']['Update'];

// Public API types for minimized next-session payload

export interface PublicClassTutorInfo {
  first_name: string | null;
  last_name: string | null;
}

export interface PublicClassInfo {
  id: string;
  name: string | null;
  subject: string | null;
  tutor?: PublicClassTutorInfo;
}

export interface PublicNextSession {
  id: string;
  class_id: string;
  start_time: string | null;
  end_time: string | null;
  title: string | null;
  description: string | null;
  updated_at: string | null;
  class: PublicClassInfo;
}

export interface PublicNextSessionResponse {
  success: boolean;
  data: PublicNextSession | null;
}