'use client';

import React, { useState } from 'react';
import BaseDialog from '../base-v2/BaseDialog';
import { ClassListStudent } from '~/lib/classes/types/class-v2';
import Button from '~/core/ui/Button';
import Modal from '~/core/ui/Modal';
import ErrorBoundary from '~/core/ui/ErrorBoundary';
import { useFormStatus } from 'react-dom';
import Alert from '~/core/ui/Alert';
import { generateStudentPDF } from '~/lib/utils/pdfGenerator';
import { deleteStudentEnrollment } from '~/lib/user/actions.server';
import { Download, Mail, MapPin, Phone, Search, Trash2 } from 'lucide-react';
import { Input } from '../base-v2/ui/Input';
import { ScrollArea } from '../base-v2/ui/scroll-area';

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
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.phone_number.includes(searchTerm)
  );

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={`Registered Students - ${classDataName}`}
      maxWidth="2xl"
      showCloseButton={false}
    >
      <div className="space-y-4 py-2">
        <div className="flex items-center justify-between">
          <div className="relative flex-grow max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
            <Input
              placeholder="Search students..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            onClick={() => generateStudentPDF(students, classDataName || "")}
            className="bg-primary-blue-600 hover:bg-primary-blue-700 text-white"
          >
            <Download size={16} className="mr-2" />
            Export List
          </Button>
        </div>
        <ScrollArea className="h-[400px] rounded-md border">
          <div className="space-y-2 p-4">
            {filteredStudents.map((student) => (
              <div
                key={student.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-neutral-50 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3 mb-2 sm:mb-0">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-blue-100 text-primary-blue-600 font-medium">
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-medium text-neutral-900">{student.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                      <Mail size={16} className="text-neutral-400" />
                      {student.email}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 text-sm text-neutral-600">
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-neutral-400" />
                    {student.phone_number}
                  </div>

                </div>
                <RemoveStudentModal enrollmentId={student?.enrollmentId} />
              </div>
            ))}
            {filteredStudents.length === 0 && (
              <div className="text-center py-8 text-neutral-500">
                <p>No students found matching your search.</p>
              </div>
            )}
          </div>
        </ScrollArea>
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
        <Button data-cy={'remove-student-button'} variant={'ghost'} size={'small'} className='p-0'>
          <Trash2 size={16} />
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
