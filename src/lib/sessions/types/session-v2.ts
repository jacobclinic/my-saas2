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
  meeting_url: string | null;
}

interface SessionClass {
  id: string;
  name: string | null;
  subject?: string | null;
  tutor_id: string;
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
  materials: SessionMaterial[];
}

interface PastSessionAttendanceStudent {
  id: string;
  first_name: string | null;
  last_name: string | null;
}
interface PastSession extends UpcomingSession {
  attendance: {
    id: string;
    student_id: string | null;
    time: string | null;
    student: PastSessionAttendanceStudent;
  }[];
}

export type { Session, UpcomingSession, PastSession };