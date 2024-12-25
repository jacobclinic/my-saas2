import React from 'react';

interface AttendanceRecord {
  name: string;
  joinTime: string;
  duration: string;
}

interface Material {
  id: number;
  name: string;
  size: string;
  url: string;
}

interface PastSessionData {
  id: number;
  name: string;
  topic: string;
  date: string;
  time: string;
  recordingUrl: string;
  attendance: AttendanceRecord[];
  materials: Material[];
}

interface LinkCopiedState {
  [key: string]: boolean;
}

interface SelectedSession {
  id: number;
  name: string;
  date: string;
  time: string;
  attendance: AttendanceRecord[];
}

interface AttendanceDialogProps {
  showAttendanceDialog: boolean;
  setShowAttendanceDialog: (show: boolean) => void;
  selectedSession: SelectedSession | null;
}

interface PastSessionsCardProps {
  sessionData: PastSessionData;
  linkCopied: LinkCopiedState;
  handleCopyLink: (id: number, link: string, type: string) => void;
}

export type {
  AttendanceRecord,
  Material,
  PastSessionData,
  LinkCopiedState,
  SelectedSession,
  AttendanceDialogProps,
  PastSessionsCardProps
};