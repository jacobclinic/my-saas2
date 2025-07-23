export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const GRADES = [
  '2025 A/L',
  '2026 A/L',
  '2027 A/L',
  'Grade 11',
  'Grade 10',
  'Grade 9',
  'Grade 8',
  'Grade 7',
  'Grade 6',
  'Grade 5',
  'Not applicable',
];

export const SUBJECTS = [
  'Accounting',
  'Business Studies',
  'Economics',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
];

// Get the day number (0-6, where 0 is Sunday)
export const dayMap: { [key: string]: number } = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

export const columnWidthsAdminStudentPayments = {
  actions: '80px',
  status: '30px',
  amount: '100px',
  period: '100px',
  submittedDate: '120px',
  invoiceNo: '200px',
};

export const columnWidthsAdminTutorPayments = {
  actions: '80px',
  status: '30px',
  amount: '100px',
  period: '100px',
  submittedDate: '120px',
  invoiceNo: '300px',
};

export const columnWidthsAdminTutor = {
  action: '80px',
  name: '200px',
  email: '200px',
  phoneNumber: '150px',
  subjects: '200px',
  activeClasses: '120px',
  appliedDate: '120px',
  status: '120px',
};

export const CLASS_SIZE_OPTIONS = ['1-5', '6-10', '11-15', '16-20', '20+'];
