'use client';

import React from 'react';
import { Badge } from '../base-v2/ui/Badge';
import BaseDialog from '../base-v2/BaseDialog';

interface Student {
  id: number;
  name: string;
  email: string;
  status: string;
}

interface RegisteredStudentsDialogProps {
  open: boolean;
  onClose: () => void;
  className?: string;
  classData: {
    id: number;
    name: string;
  };
}

const RegisteredStudentsDialog: React.FC<RegisteredStudentsDialogProps> = ({
  open,
  onClose,
  classData,
}) => {
  // Sample students data - in real app, this would come from props or API
  const students: Student[] = Array.from({ length: 5 }).map((_, i) => ({
    id: i + 1,
    name: `Student ${i + 1}`,
    email: `student${i + 1}@example.com`,
    status: 'Active',
  }));

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={`Registered Students - ${classData.name}`}
      maxWidth="2xl"
      showCloseButton={true}
      closeButtonText="Close"
    >
      <div className="space-y-4">
        <div className="border rounded-lg divide-y">
          {students.map((student) => (
            <div
              key={student.id}
              className="p-4 flex justify-between items-center"
            >
              <div>
                <p className="font-medium">{student.name}</p>
                <p className="text-sm text-gray-600">{student.email}</p>
              </div>
              <Badge variant="outline">{student.status}</Badge>
            </div>
          ))}
        </div>
      </div>
    </BaseDialog>
  );
};

export default RegisteredStudentsDialog;
