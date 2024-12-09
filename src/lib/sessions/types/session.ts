interface ClassType {
  id: string;
  name: string;
  description?: string;
  subject: string;
  tutor: string;
  students?: string[];
  sessions?: string[];
  fee?: number;
  payments?: string[];
  status?: string;
}

// Tutor object structure for fetched data
interface Tutor {
  id: string;
  name: string;
}

// Extended Class Type for fetched data
interface ClassTypeWithTutor extends Omit<ClassType, 'tutor'> {
  tutor: Tutor; // Replace `tutor` string with detailed object
}

type SessionTableData = {
  id: string;
  date: string;
  class: string;
  tutor: string;
  subject: string;
  noOfStudents: number;
  noOfAtendedStudents: number;
  action: string;
};

export default ClassType;
export type { ClassTypeWithTutor, SessionTableData };