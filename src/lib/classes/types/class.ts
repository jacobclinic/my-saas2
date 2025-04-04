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
  firstName: string;
  lastName: string;
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

type ClassTableData = {
  id: string;
  name: string;
  tutor: string;
  subject: string;
  noOfStudents: number;
  action: string;
};

export default ClassType;
export type { ClassWithTutorAndEnrollment, ClassWithTutorAndEnrollmentAndNextSession, TimeSlot, ClassTableData };