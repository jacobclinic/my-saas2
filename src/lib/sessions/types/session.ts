interface SessionsType {
  id: string;
  classId: string;
  recordingUrls?: string[];
  status?: string; // Upcoming/Completed/Cancelled
  startTime: string;
  endTime?: string;
  recurringSessionId?: string;
  title?: string;
  description?: string;
  updatedAt?: string;
}
interface SessionTableClass {
  id: string;
  name: string;
  tutorId: string;
  tutor: {
    id: string;
    firstName: string;
    lastName: string;
  };
  noOfStudents: number;
}

// Extended Sessions Type for fetched data
interface SessionsWithTableData extends SessionsType {
  class: SessionTableClass;
  noOfAtendedStudents: number;
}

type SessionTableData = {
  id: string;
  date: string;
  class: string;
  tutor: string;
  noOfStudents: number;
  noOfAtendedStudents: number;
  action: string;
};

export default SessionsType;
export type { SessionsWithTableData, SessionTableData };