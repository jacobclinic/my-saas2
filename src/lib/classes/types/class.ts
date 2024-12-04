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

export default ClassType;
export type { ClassTypeWithTutor };