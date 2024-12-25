import React from 'react';

interface Material {
  id: number;
  name: string;
  size: string;
}

interface UpcomingSessionTableData {
  id: number;
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
}

interface UploadedMaterial {
  id: string;
  name: string;
  size: string;
  type: string;
  file: File;
}

interface LinkCopiedState {
  [key: string]: boolean;
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
  linkCopied: LinkCopiedState;
  handleCopyLink: (id: number, link: string, type: string) => void;
  variant?: 'default' | 'dashboard';
}

export type {
  Material,
  UpcomingSessionTableData,
  UploadedMaterial,
  LinkCopiedState,
  EditingLessonState,
  LessonDetailsState,
  MaterialUploadDialogProps,
  UpcommingSessionCardProps
};