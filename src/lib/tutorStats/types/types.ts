export type TutorDashboardData = {
  tutor_id: string;
  activeClasses: {
    id: string;
    name: string | null;
    subject: string | null;
  }[];
  totalStudents: number;
  nextSession: {
    id: string;
    class_id: string | null;
    start_time: string | null;
  } | null;
  monthlyEarnings: number;
};

export type ClassWithEnrollmentRawData = {
  id: string;
  name: string | null;
  subject: string | null;
  student_class_enrollments: { count: number }[];
};
