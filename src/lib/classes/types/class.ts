import { Json } from "~/database.types";

interface ClassType {
  id: string;
  name: string;
  description?: string;
  subject: string;
  tutorId: string;
  fee?: number;
  status?: string;
  timeSlots?: TimeSlot[];
}

// Tutor object structure for fetched data
interface ClassTableTutor {
  id: string;
  first_name: string;
  last_name: string;
}

interface TimeSlot {
  day: string;
  time: string;
  duration: string;
  reccurringPattern: string;
}

// Extended Class Type for fetched data
interface ClassWithTutorAndEnrollment extends ClassType {
  tutor: ClassTableTutor;
  noOfStudents: number;
}


interface ClassWithTutorAndEnrollmentAndNextSession {
  id: string;
  name: string;
  description?: string;
  subject: string;
  tutorId: string;
  fee?: number;
  status?: string;
  time_slots?: TimeSlot[];
  tutor: ClassTableTutor;
  noOfStudents: number | null;
  nextSession: string | null;
}

interface ClassWithTutorDetails{
  id: string;
  name: string;
  description?: string;
  subject: string;
  tutorId: string;
  fee: number;
  status: string;
  time_slots?: TimeSlot[];
  tutor: ClassTableTutor;
}

type ClassTableData = {
  id: string;
  name: string;
  tutor: string;
  subject: string;
  noOfStudents: number;
  action: string;
};

export interface ClassWithTutorData {
  id: string;
  name: string | null;
  description: string | null;
  subject: string | null;
  tutor_id: string;
  fee: number | null;
  status: string | null;
  time_slots: Json[] | null;
  grade: string | null;
  starting_date: string | null;
  created_at: string;
  tutor: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone_number: string | null;
    photo_url: string | null;
    biography: string | null;
    display_name: string | null;
    address: string | null;
    city: string | null;
    district: string | null;
    education_level: string | null;
    subjects_teach: string[] | null;
    user_role: string | null;
  } | null;
}

export default ClassType;
export type { ClassWithTutorAndEnrollment, ClassWithTutorDetails, ClassWithTutorAndEnrollmentAndNextSession, TimeSlot, ClassTableData };