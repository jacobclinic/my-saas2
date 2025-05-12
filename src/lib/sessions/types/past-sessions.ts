import React from 'react';
import { ZoomParticipant } from '~/lib/zoom/types/zoom.types';

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
  zoom_meeting_id: string;
  classId: string;
  tutorId: string;
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
  attendance: ZoomParticipant[];
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
