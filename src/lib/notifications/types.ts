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


type UnpaidStudent = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone_number: string | null;
};

type Payment = {
  id: string;
  payment_period: string | null;
  status: string | null;
  amount: number | null;
  class_id: string | null;
  student_id: string | null;
};

type Enrollment = {
  id: string;
  student_id: string;
  student: UnpaidStudent | UnpaidStudent[];
};

type Class = {
  id: string;
  name: string | null;
  subject: string | null;
  fee: number | null;
  tutor_id: string;
  students: Enrollment[] | null;
};

type Session = {
  id: string;
  start_time: string | null;
  end_time: string | null;
  title: string | null;
  description: string | null;
  class_id: string | null;
  class: Class | null; // One-to-one relationship, not an array
};

// Output type for transformed data
type SessionWithUnpaidStudents = {
  session_id: string;
  start_time: string | null;
  end_time: string | null;
  title: string | null;
  description: string | null;
  class: {
    id: string;
    name: string | null;
    subject: string | null;
    fee: number | null;
    tutor_id: string;
    unpaid_students: {
      enrollment_id: string;
      student: UnpaidStudent;
    }[];
  };
};
