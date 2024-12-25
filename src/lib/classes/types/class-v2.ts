// types.ts
export interface ClassListData {
  id: number;
  name: string;
  schedule: string;
  subject?: string;
  status?: string;
  students: number;
  academicYear?: string;
  registrationLink: string;
  nextClass?: string;
}

export interface ClassCardProps {
  classData: ClassListData;
  linkCopied: { [key: string]: boolean };
  onCopyLink: (classId: number, link: string) => void;
  variant?: 'default' | 'dashboard';
  showViewDetails?: boolean;
}

export interface NewStudentData {
  name: string;
  email: string;
  phone: string;
}

export interface TimeSlot {
  day: string;
  time: string;
}

export interface NewClassData {
  // fee: string;

  name: string;
  subject: string;
  description: string;
  yearGrade: string;
  monthlyFee: string;
  startDate: string;
  timeSlots: TimeSlot[];
}

export interface LinkCopiedState {
  [key: string]: boolean;
}

export interface EditClassData {
  name: string;
  subject: string;
  description: string;
  yearGrade: string;
  monthlyFee: string;
  startDate: string;
  timeSlots: { day: string; time: string; }[];
  status: 'active' | 'inactive' | 'draft';
}
