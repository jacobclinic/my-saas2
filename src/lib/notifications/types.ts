interface Student {
  id: string;
  student: {
    id: string;
    first_name: string | null; 
    last_name: string | null;  
    email: string;             
    phone_number: string | null; 
  };
}

interface NotificationClass {
  id: string;
  created_at: string;
  class_id: string | null; 
  recording_urls: string[] | null;
  status: string;
  start_time: string;
  end_time: string;
  recurring_session_id: string | null; 
  title: string | null;
  description: string | null;
  updated_at: string | null; 
  meeting_url: string;
  zoom_meeting_id: string;
  class: {
    id: string;
    name: string | null;
    subject: string | null;
    tutor_id: string;
    students: Student[];
  };
}