'use client';

import React from 'react';
import { Badge } from '../base-v2/ui/Badge';
import BaseDialog from '../base-v2/BaseDialog';
import { ClassListStudent } from '~/lib/classes/types/class-v2';
import Button from '~/core/ui/Button';
import Modal from '~/core/ui/Modal';
import ErrorBoundary from '~/core/ui/ErrorBoundary';
import { TextFieldInput, TextFieldLabel } from '~/core/ui/TextField';
import { useFormStatus } from 'react-dom';
import Alert from '~/core/ui/Alert';
import { generateStudentPDF } from '~/lib/utils/pdfGenerator';
import { deleteStudentEnrollment } from '~/lib/user/actions.server';

interface Student {
  id: string;
  enrollmentId: string;
  name: string;
  email: string;
  phone_number: string;
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
  // console.log('studentData', studentData)
  // Sample students data - in real app, this would come from props or API
  const students: Student[] = studentData.map((student) => {
    let studentTemp;
    if (student?.student) {
      if (Array.isArray(student.student)) studentTemp = student.student[0];
      else studentTemp = student.student;
    }
    return ({
      id: student.student_id,
      enrollmentId: student.id,
      name: `${studentTemp?.first_name} ${studentTemp?.last_name}`,
      email: studentTemp?.email || '',
      phone_number: studentTemp?.phone_number || '',
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
      onConfirm={() => generateStudentPDF(students, classDataName || "")}
      confirmButtonText="Export Students List"
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
                  <p className="text-sm text-gray-600">{student.phone_number}</p>
                </div>
                <div>
                  <RemoveStudentModal enrollmentId={student?.enrollmentId} />
                </div>
                {/* <Badge variant="outline">{student.status}</Badge> */}
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

function RemoveStudentModal({ enrollmentId }: { enrollmentId: string }) {
  return (
    <Modal
      heading={`Remove student`}
      Trigger={
        <Button data-cy={'remove-student-button'} variant={'destructive'} size={'small'}>
          Remove
        </Button>
      }
    >
      <ErrorBoundary fallback={<RemoveStudentErrorAlert />}>
        <RemoveStudentForm enrollmentId={enrollmentId} />
      </ErrorBoundary>
    </Modal>
  );
}

function RemoveStudentForm({ enrollmentId }: { enrollmentId: string }) {
  return (
    <form
      action={() => deleteStudentEnrollment({
        enrollmentId: enrollmentId
      })}
      className={'flex flex-col space-y-4'}
    >
      <div className={'flex flex-col space-y-6'}>
        <div>Are you sure you want to remove this student?</div>
      </div>

      <div className={'flex justify-end space-x-2.5'}>
        <RemoveStudentSubmitButton />
      </div>
    </form>
  );
}

function RemoveStudentSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      data-cy={'confirm-remove-student-button'}
      name={'action'}
      value={'delete'}
      variant={'destructive'}
      loading={pending}
    >
      Yes, remove this student
    </Button>
  );
}

function RemoveStudentErrorAlert() {
  return (
    <Alert type={'error'}>
      <Alert.Heading>Sorry, we couldn&apos;t remove this student</Alert.Heading>
      Please try again later or contact support if the problem persists.
    </Alert>
  );
}
