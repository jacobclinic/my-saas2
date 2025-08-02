import React from 'react';
import { PastSession, UpcomingSession } from './session';
import { PaymentStatus } from '~/lib/payments/types/admin-payments';

interface Material {
  id: string;
  name: string | null;
  url?: string | null;
  file_size: string | null;
}

interface UpcomingSessionTableData {
  id: string;
  name: string;
  subject: string;
  date: string;
  time?: string;
  start_time: string;
  end_time: string;
  registeredStudents: number;
  zoomLinkTutor: string;
  zoomLinkStudent: string;
  zoomMeetingId: string;
  materials?: Material[];
  lessonTitle?: string;
  lessonDescription?: string;
  sessionRawData?: UpcomingSession;
}

interface SessionStudentTableData {
  id: string;
  name: string;
  topic?: string | null;
  date: string;
  time: string;
  paymentStatus: PaymentStatus;
  paymentAmount?: number;
  zoomLink?: string;
  zoomMeetingId: string;
  recordingUrl?: string[];
  materials?: Material[];
  sessionRawData?: UpcomingSession | PastSession;
  classId?: string;
}

interface UploadedMaterial {
  id: string;
  name: string;
  size: string;
  type: string;
  file: File;
}

interface EditingLessonState {
  [key: number]: boolean;
}

interface LessonDetailsState {
  [key: number]: {
    title: string;
    description: string;
  };
}

interface LessonDetails {
  title: string;
  description: string;
}

interface MaterialUploadDialogProps {
  showMaterialDialog: boolean;
  setShowMaterialDialog: (show: boolean) => void;
  uploadedMaterials: UploadedMaterial[];
  setUploadedMaterials: React.Dispatch<
    React.SetStateAction<UploadedMaterial[]>
  >;
  materialDescription: string;
  setMaterialDescription: (description: string) => void;
  sessionId: string;
  onSuccess: (materials: Material[]) => void;
  existingMaterials?: Material[];
}

interface UpcommingSessionCardProps {
  sessionData: UpcomingSessionTableData;
  variant?: 'default' | 'dashboard';
}

export type {
  Material,
  UpcomingSessionTableData,
  SessionStudentTableData,
  UploadedMaterial,
  EditingLessonState,
  LessonDetailsState,
  LessonDetails,
  MaterialUploadDialogProps,
  UpcommingSessionCardProps,
};
