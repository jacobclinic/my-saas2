import { Json } from "~/database.types";
import { PaymentStatus } from "~/lib/payments/types/admin-payments";

// types.ts

interface StudentData {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone_number?: string | null;
  status?: string | null;
}
export interface ClassListStudent {
  id: string;
  student_id: string;
  student?: StudentData | StudentData[];
}
interface NextSession {
  id: string;
  start_time: string;
}

export interface ClassType {
  id: string
  created_at?: string
  name?: string | null
  description: string | null
  subject: string | null
  tutor_id: string
  fee: number | null
  status: string | null  
  time_slots: {
    day: string;
    startTime: string;
    endTime: string;
  }[] | null
  grade: string | null
  starting_date: string | null
  students?: ClassListStudent[] | []
  upcomingSession: string | null
}

export interface ClassForStudentType {
  id: string | null;
  class_id: string | null;
  student_id: string | null;
  class: {
    id?: string | null;
    name?: string | null;
    description?: string | null;
    subject?: string | null;
    tutor_id?: string | null;
    tutor?: {
      id: string | null;
      first_name: string | null;
      last_name: string | null;
    };
    fee?: number | null;
    status?: string | null;
    grade?: string | null;
  };
}

export interface StudentPayment {
  id: string;
  period: string;
  status: PaymentStatus;
  date: string;
}

export interface StudentClassListType {
  id: string;
  name?: string | null
  schedule?: string;
  nextClass?: string;
  subject?: string;
  status?: string;
  students?: number;
  grade?: string;
  fee?: number;
  payments?: StudentPayment[];
}
export interface ClassListData {
  id: string;
  name?: string | null
  schedule?: string;
  subject?: string;
  status?: string;
  students?: number;
  grade?: string;
  registrationLink?: string;
  nextClass?: string;
  description?: string;
  timeSlots?: { day: string; time: string; }[];
  classRawData?: ClassType;
}

export interface ClassCardProps {
  classData: ClassListData;
  variant?: 'default' | 'dashboard';
  showViewDetails?: boolean;
}

export interface NewStudentData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface TimeSlot {
  day: string;
  startTime: string;
  endTime: string;
}

export interface NewClassData {
  // fee: string;

  name: string;
  subject: string;
  description: string;
  yearGrade: string;
  monthlyFee: string;
  startDate: string;
  timeSlots: [{
    day: string;
    startTime: string;
    endTime: string;
  }];
  tutorId: string;
}

export interface LinkCopiedState {
  [key: string]: boolean;
}

export interface EditClassData {
  name: string;
  subject: string;
  description: string;
  yearGrade: string;
  monthlyFee: number;
  startDate: string;
  timeSlots: TimeSlot[];
  status: 'active' | 'inactive' | 'draft';
}
