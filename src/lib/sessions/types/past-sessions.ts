import React from 'react';

interface AttendanceRecord {
  name: string;
  joinTime: string;
  duration: string;
}

interface Material {
  id: string;
  name: string;
  file_size: string;
  url: string;
}

interface PastSessionData {
  id: string;
  name: string;
  topic: string;
  date: string;
  time: string;
  recordingUrl: string[];
  attendance: AttendanceRecord[];
  materials: Material[];
}
interface SelectedSession {
  id: string;
  name: string;
  date: string;
  time: string;
  attendance: AttendanceRecord[];
}

interface SelectedSessionAdmin extends SelectedSession {
  tutorName: string | null;
  topic: string | null;
  subject: string | null;
}

interface AttendanceDialogProps {
  showAttendanceDialog: boolean;
  setShowAttendanceDialog: (show: boolean) => void;
  selectedSession: SelectedSession | null;
}

interface PastSessionsCardProps {
  sessionData: PastSessionData;
}

export type {
  AttendanceRecord,
  Material,
  PastSessionData,
  SelectedSession,
  AttendanceDialogProps,
  PastSessionsCardProps,
  SelectedSessionAdmin
};
