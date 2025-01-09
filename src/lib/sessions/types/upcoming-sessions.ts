import React from 'react';
import { UpcomingSession } from './session-v2';

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
  time: string;
  registeredStudents: number;
  zoomLinkTutor: string;
  zoomLinkStudent: string;
  materials?: Material[];
  lessonTitle?: string;
  lessonDescription?: string;
  sessionRawData?: UpcomingSession;
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
  setUploadedMaterials: React.Dispatch<React.SetStateAction<UploadedMaterial[]>>;
  materialDescription: string;
  setMaterialDescription: (description: string) => void;
}

interface UpcommingSessionCardProps {
  sessionData: UpcomingSessionTableData;
  variant?: 'default' | 'dashboard';
}

export type {
  Material,
  UpcomingSessionTableData,
  UploadedMaterial,
  EditingLessonState,
  LessonDetailsState,
  LessonDetails,
  MaterialUploadDialogProps,
  UpcommingSessionCardProps
};