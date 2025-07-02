'use client';

import React, { useState, useTransition } from 'react';
import { Input } from '../base-v2/ui/Input';
import { AlertTriangle, User, Mail, Phone } from 'lucide-react';
import { ClassListData, NewStudentData } from '~/lib/classes/types/class-v2';
import BaseDialog from '../base-v2/BaseDialog';
import { Alert, AlertDescription } from '../base-v2/ui/Alert';
import useCsrfToken from '~/core/hooks/use-csrf-token';
import { useToast } from '../../lib/hooks/use-toast';
import { sendEmailMSGToStudentAction } from '~/lib/classes/server-actions-v2';

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
  loading = false,
}) => {
  const [isPending, startTransition] = useTransition();
  const csrfToken = useCsrfToken();
  const { toast } = useToast();

  const [newStudent, setNewStudent] = useState<NewStudentData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Validation function
  const validateField = (name: string, value: string) => {
    let error = '';

    switch (name) {
      case 'firstName':
      case 'lastName':
        if (value.length < 3) {
          error = `${name === 'firstName' ? 'First name' : 'Last name'} must be at least 3 characters`;
        }
        break;
      case 'email':
        if (!emailRegex.test(value)) {
          error = 'Please enter a valid email address';
        }
        break;
      case 'phone':
        if (value.length < 10) {
          error = 'Phone number must be at least 10 characters';
        }
        break;
    }

    return error;
  };

  const handleInputChange = (name: string, value: string) => {
    setNewStudent({ ...newStudent, [name]: value });

    // Validate the field and update errors
    const error = validateField(name, value);
    setErrors({ ...errors, [name]: error });
  };

  const handleClose = () => {
    onClose();
    setNewStudent({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
    });
    setErrors({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
    });
  };

  const handleSubmit = () => {
    if (!classData?.id) return;

    startTransition(async () => {
      const notificationResult = await sendEmailMSGToStudentAction({
        email: newStudent.email,
        classId: classData.id,
        name: newStudent.firstName + ' ' + newStudent.lastName,
        phoneNumber: newStudent.phone,
      });
      if (notificationResult.success) {
        toast({
          title: 'Success',
          description: 'Student notified successfully',
          variant: 'default',
        });
      } else {
        toast({
          title: 'Error',
          description:
            'Student invitation failed. Invalid email or phone number',
          variant: 'destructive',
        });
        onClose();
        setNewStudent({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
        });
      }
    });
    onAddStudent(newStudent);
  };

  const isValid =
    newStudent.firstName.length >= 3 &&
    newStudent.lastName.length >= 3 &&
    emailRegex.test(newStudent.email) &&
    newStudent.phone.length >= 10 &&
    Object.values(errors).every((error) => error === '');

  return (
    <BaseDialog
      open={open}
      onClose={handleClose}
      title={`Add Student to ${classData?.name}`}
      description="Create a student account and send login credentials via email"
      maxWidth="xl"
      onConfirm={handleSubmit}
      confirmButtonText="Add Student & Send Invitation"
      loading={loading}
      confirmButtonDisabled={!isValid}
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
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                icon={<User className="h-4 w-4 text-gray-500" />}
              />
              {errors.firstName && (
                <p className="text-sm text-red-500 mt-1">{errors.firstName}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Last Name</label>
              <Input
                placeholder="Enter last name"
                value={newStudent.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                icon={<User className="h-4 w-4 text-gray-500" />}
              />
              {errors.lastName && (
                <p className="text-sm text-red-500 mt-1">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              placeholder="Enter student's email"
              value={newStudent.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              icon={<Mail className="h-4 w-4 text-gray-500" />}
            />
            {errors.email && (
              <p className="text-sm text-red-500 mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Phone Number</label>
            <Input
              placeholder="Enter phone number"
              value={newStudent.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              icon={<Phone className="h-4 w-4 text-gray-500" />}
            />
            {errors.phone && (
              <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
            )}
          </div>
        </div>

        {/* Information Alerts */}
        <div className="space-y-3">
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-700">
              The student will receive an email with the instructions to access
              the platform.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </BaseDialog>
  );
};

export default AddStudentDialog;
