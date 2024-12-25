// AddStudentDialog.tsx
import React, { useState } from 'react';
import { Input } from "../base-v2/ui/Input";
import { AlertTriangle } from 'lucide-react';
import { ClassListData, NewStudentData } from '~/lib/classes/types/class-v2';
import BaseDialog from '../base-v2/BaseDialog';

interface AddStudentDialogProps {
  open: boolean;
  onClose: () => void;
  classData: ClassListData | null;
  onAddStudent: (studentData: NewStudentData) => void;
  loading?: boolean;
}

const AddStudentDialog: React.FC<AddStudentDialogProps> = ({
  open,
  onClose,
  classData,
  onAddStudent,
  loading = false
}) => {
  const [newStudent, setNewStudent] = useState<NewStudentData>({
    name: '',
    email: '',
    phone: ''
  });

  const handleSubmit = () => {
    onAddStudent(newStudent);
  };

  const isValid = newStudent.name && newStudent.email && newStudent.phone;

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={`Add Student to ${classData?.name}`}
      maxWidth="md"
      onConfirm={handleSubmit}
      confirmButtonText="Add Student"
      loading={loading}
      confirmButtonVariant={isValid ? 'default' : 'secondary'}
    >
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Student Name</label>
          <Input 
            placeholder="Enter student's full name"
            value={newStudent.name}
            onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
          />
        </div>
        
        <div>
          <label className="text-sm font-medium">Email</label>
          <Input 
            type="email"
            placeholder="Enter student's email"
            value={newStudent.email}
            onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
          />
        </div>
        
        <div>
          <label className="text-sm font-medium">Phone Number</label>
          <Input 
            placeholder="Enter student's phone number"
            value={newStudent.phone}
            onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
          />
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm flex items-start space-x-2">
          <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
          <p className="text-yellow-700">
            Adding a student will give them immediate access to class materials and recordings.
          </p>
        </div>
      </div>
    </BaseDialog>
  );
};

export default AddStudentDialog;