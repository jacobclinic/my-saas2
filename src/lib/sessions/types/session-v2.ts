interface Session {
  id: string;
  created_at: string;
  class_id: string;
  recording_urls: string | null;
  start_time: string;
  end_time: string | null;
  recurring_session_id: string | null;
  title: string | null;
  description: string | null;
  updated_at: string | null;
  meeting_url: string | null;
}

interface StudentSessionAttendance {
  id: string;
  session_id: string;
  student_id: string;
  time: string;
  created_at: string;
}

interface UpcomingSession extends Session {
  class: {
    id: string;
    name: string;
    subject?: string | null;
    tutor_id: string;
    no_of_students?: number | null;
  };
  materials: {
    id: string;
    name: string | null;
    url: string;
    file_size: string | null;
  }[];
}

interface PastSession extends Session {
  class: {
    id: string;
    name: string;
    subject?: string | null;
    tutor_id: string;
    no_of_students?: number | null;
  };
  materials: {
    id: string;
    name: string | null;
    url: string;
    file_size: string | null;
  }[];
  attendance: {
    id: string;
    student_id: string;
    time: string;
    student: {
      id: string;
      first_name: string;
      last_name: string;
    };
  }[];
}

export type { Session, UpcomingSession, PastSession };