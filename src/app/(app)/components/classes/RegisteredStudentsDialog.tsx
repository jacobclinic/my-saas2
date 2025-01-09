'use client';

import React from 'react';
import { Badge } from '../base-v2/ui/Badge';
import BaseDialog from '../base-v2/BaseDialog';
import { ClassListStudent } from '~/lib/classes/types/class-v2';

interface Student {
  id: string;
  name: string;
  email: string;
  status: string;
}

interface RegisteredStudentsDialogProps {
  open: boolean;
  onClose: () => void;
  classDataName?: string | null;
  studentData: ClassListStudent[];
}

const RegisteredStudentsDialog: React.FC<RegisteredStudentsDialogProps> = ({
  open,
  onClose,
  classDataName,
  studentData,
}) => {
  // Sample students data - in real app, this would come from props or API
  const students: Student[] = studentData.map((student) => {
    let studentTemp;
    if (student?.student) {
      if (Array.isArray(student.student)) studentTemp = student.student[0];
      else studentTemp = student.student;
    }
    return ({
      id: student.student_id,
      name: `${studentTemp?.first_name} ${studentTemp?.last_name}`,
      email: studentTemp?.email || '',
      status: studentTemp?.status || '',    
    })
  });

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={`Registered Students - ${classDataName}`}
      maxWidth="2xl"
      showCloseButton={true}
      closeButtonText="Close"
    >
      <div className="space-y-4">
        <div className="border rounded-lg divide-y">
          {students.length > 0 ? (
            students.map((student) => (
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
            ))
          ) : (
            <div className="p-4 flex justify-center items-center">
              <p className="text-sm text-gray-600">
                No students registered yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </BaseDialog>
  );
};

export default RegisteredStudentsDialog;
