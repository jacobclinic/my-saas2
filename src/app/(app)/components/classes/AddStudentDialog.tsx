'use client'

import React, { useState, useTransition } from 'react';
import { Input } from "../base-v2/ui/Input";
import { AlertTriangle, User, Mail, Phone } from 'lucide-react';
import { ClassListData, NewStudentData } from '~/lib/classes/types/class-v2';
import BaseDialog from '../base-v2/BaseDialog';
import { Alert, AlertDescription } from "../base-v2/ui/Alert";
import useCsrfToken from '~/core/hooks/use-csrf-token';
import { createStudentAction } from '~/lib/user/actions/student';
import { useToast } from '../../lib/hooks/use-toast';

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
  const [isPending, startTransition] = useTransition();
  const csrfToken = useCsrfToken();
  const { toast } = useToast()
  
  const [newStudent, setNewStudent] = useState<NewStudentData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  const handleSubmit = () => {
    if (!classData?.id) return;

    startTransition(async () => {
      const result = await createStudentAction({
        ...newStudent,
        classId: classData.id,
        nameOfClass: classData.name || "",
        csrfToken
      });

      if (result.success) {
        toast({
          title: "Success",
          description: "Student account created and invitation sent",
          variant: "success",
        });
        onClose();
        setNewStudent({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create student account",
          variant: "destructive",
        });
      }
    });
    onAddStudent(newStudent);
  };

  const isValid = 
    newStudent.firstName && 
    newStudent.lastName && 
    newStudent.email && 
    newStudent.phone;

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={`Add Student to ${classData?.name}`}
      description="Create a student account and send login credentials via email"
      maxWidth="xl"
      onConfirm={handleSubmit}
      confirmButtonText="Add Student & Send Invitation"
      loading={loading}
      confirmButtonVariant={isValid ? 'default' : 'secondary'}
    >
      <div className="space-y-6">
        {/* Student Information Section */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">First Name</label>
              <Input 
                placeholder="Enter first name"
                value={newStudent.firstName}
                onChange={(e) => setNewStudent({ ...newStudent, firstName: e.target.value })}
                icon={<User className="h-4 w-4 text-gray-500" />}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Last Name</label>
              <Input 
                placeholder="Enter last name"
                value={newStudent.lastName}
                onChange={(e) => setNewStudent({ ...newStudent, lastName: e.target.value })}
                icon={<User className="h-4 w-4 text-gray-500" />}
              />
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium">Email</label>
            <Input 
              type="email"
              placeholder="Enter student's email"
              value={newStudent.email}
              onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
              icon={<Mail className="h-4 w-4 text-gray-500" />}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Phone Number</label>
            <Input 
              placeholder="Enter phone number"
              value={newStudent.phone}
              onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
              icon={<Phone className="h-4 w-4 text-gray-500" />}
            />
          </div>
        </div>

        {/* Information Alerts */}
        <div className="space-y-3">
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-700">
              The student will receive an email with their login credentials and instructions to access the platform.
            </AlertDescription>
          </Alert>

          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription className="text-blue-700">
              A temporary password will be generated and sent to the student&apos;s email address.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </BaseDialog>
  );
};

export default AddStudentDialog;