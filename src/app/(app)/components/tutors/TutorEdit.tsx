'use client';

import React, { useState, useEffect } from 'react';
import BaseDialog from '../base-v2/BaseDialog';
import { Input } from '../base-v2/ui/Input';
import Label from '~/core/ui/Label';
import { Textarea } from '../base-v2/ui/Textarea';
import { CLASS_SIZE_OPTIONS } from '~/lib/constants-v2';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../base-v2/ui/Select';
import UserType from '~/lib/user/types/user';
import { CommaZoomUser } from '~/lib/zoom/v2/types';

interface ExtendedUserType extends UserType {
  activeClassesCount?: number;
  zoom_user: CommaZoomUser | null;
}
interface TutorEditProps {
  open: boolean;
  onClose: () => void;
  tutor: ExtendedUserType | null;
  onSave: (updatedTutor: Partial<ExtendedUserType>) => Promise<void>;
}

interface FormData {
  first_name: string;
  last_name: string;
  phone_number: string;
  address: string;
  birthday: string;
  education_level: string;
  subjects_teach: string[];
  class_size: string;
  status: string;
}

const educationLevels = [
  'High School',
  'Associate Degree',
  "Bachelor's Degree",
  "Master's Degree",
  'PhD',
  'Other',
];

const classSizeOptions = CLASS_SIZE_OPTIONS;

const statusOptions = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
];

const TutorEdit: React.FC<TutorEditProps> = ({
  open,
  onClose,
  tutor,
  onSave,
}) => {
  const [formData, setFormData] = useState<FormData>({
    first_name: '',
    last_name: '',
    phone_number: '',
    address: '',
    birthday: '',
    education_level: '',
    subjects_teach: [],
    class_size: '',
    status: 'ACTIVE',
  });

  const [originalData, setOriginalData] = useState<FormData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [subjectsText, setSubjectsText] = useState('');

  // Initialize form data when tutor changes
  useEffect(() => {
    if (tutor && open) {
      const initialData: FormData = {
        first_name: tutor.first_name || '',
        last_name: tutor.last_name || '',
        phone_number: tutor.phone_number || '',
        address: tutor.address || '',
        birthday: tutor.birthday || '',
        education_level: tutor.education_level || '',
        subjects_teach: tutor.subjects_teach || [],
        class_size: tutor.class_size || '',
        status: tutor.status || 'ACTIVE',
      };
      setFormData(initialData);
      setOriginalData(initialData);
      setSubjectsText(tutor.subjects_teach?.join(', ') || '');
    }
  }, [tutor, open]);

  // Calculate age from birthday
  const calculateAge = (birthday: string): number => {
    if (!birthday) return 0;
    const today = new Date();
    const birthDate = new Date(birthday);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  // Validate age (13-100)
  const isValidAge = (birthday: string): boolean => {
    const age = calculateAge(birthday);
    return age >= 13 && age <= 100;
  };

  // Check if form is valid and has changes
  const isFormValid = (): boolean => {
    const requiredFields = [
      'first_name',
      'last_name',
      'phone_number',
      'address',
      'birthday',
      'education_level',
      'class_size',
      'status',
    ];

    // Check if all required fields are filled
    const allFieldsFilled = requiredFields.every((field) => {
      const value = formData[field as keyof FormData];
      return value && value.toString().trim() !== '';
    });

    // Check if subjects are provided
    const hasSubjects = subjectsText.trim() !== '';

    // Check if birthday is valid age
    const validAge = isValidAge(formData.birthday);

    // Check if data has changed
    const hasChanges = originalData
      ? JSON.stringify(formData) !== JSON.stringify(originalData) ||
        subjectsText !== (originalData.subjects_teach?.join(', ') || '')
      : false;

    return allFieldsFilled && hasSubjects && validAge && hasChanges;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubjectsChange = (value: string) => {
    setSubjectsText(value);
    const subjects = value
      .split(/[,\s]+/) // Split by commas and/or spaces
      .map((s) => s.trim())
      .filter((s) => s !== '');
    setFormData((prev) => ({
      ...prev,
      subjects_teach: subjects,
    }));
  };

  const handleSave = async () => {
    if (!isFormValid()) return;

    setIsLoading(true);
    try {
      const updatedData = {
        ...formData,
        subjects_teach: subjectsText
          .split(/[,\s]+/) // Split by commas and/or spaces
          .map((s) => s.trim())
          .filter((s) => s !== ''),
      };
      await onSave(updatedData);
      onClose();
    } catch (error) {
      console.error('Error saving tutor:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      first_name: '',
      last_name: '',
      phone_number: '',
      address: '',
      birthday: '',
      education_level: '',
      subjects_teach: [],
      class_size: '',
      status: 'ACTIVE',
    });
    setSubjectsText('');
    setOriginalData(null);
    onClose();
  };

  if (!tutor) return null;

  return (
    <BaseDialog
      open={open}
      onClose={handleClose}
      title="Edit Tutor"
      description="Update tutor information"
      maxWidth="2xl"
      showCloseButton={true}
      closeButtonText="Cancel"
      onConfirm={handleSave}
      confirmButtonText="Save Changes"
      confirmButtonDisabled={!isFormValid()}
      loading={isLoading}
    >
      <div className="space-y-6">
        {/* Personal Information */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-blue-600">
            Personal Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) =>
                  handleInputChange('first_name', e.target.value)
                }
                placeholder="First name"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                placeholder="Last name"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={tutor.email || ''}
                disabled
                placeholder="Your email address"
                className="mt-1 bg-gray-50"
              />
            </div>
            <div>
              <Label htmlFor="phone_number">Phone Number</Label>
              <Input
                id="phone_number"
                value={formData.phone_number}
                onChange={(e) =>
                  handleInputChange('phone_number', e.target.value)
                }
                placeholder="Your phone number"
                className="mt-1"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Your full address"
                className="mt-1"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="birthday">Date of Birth</Label>
              <Input
                id="birthday"
                type="date"
                value={formData.birthday}
                onChange={(e) => handleInputChange('birthday', e.target.value)}
                className="mt-1"
              />
              {formData.birthday && !isValidAge(formData.birthday) && (
                <p className="text-sm text-red-500 mt-1">
                  Age must be between 13 and 100 years
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="education_level">
                Highest Level of Education
              </Label>
              <Select
                value={formData.education_level}
                onValueChange={(value) =>
                  handleInputChange('education_level', value)
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select your education level" />
                </SelectTrigger>
                <SelectContent>
                  {educationLevels.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Teaching Information */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-blue-600">
            Teaching Information
          </h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="subjects_teach">Subjects You Teach</Label>
              <Textarea
                id="subjects_teach"
                value={subjectsText}
                onChange={(e) => handleSubjectsChange(e.target.value)}
                placeholder="List the subjects you teach (e.g., Mathematics, Physics, Chemistry, English)"
                className="mt-1"
                rows={3}
              />
              <p className="text-sm text-gray-500 mt-1">
                Please list subjects you are qualified to teach, separated by
                commas
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="class_size">Preferred Class Size</Label>
                <Select
                  value={formData.class_size}
                  onValueChange={(value) =>
                    handleInputChange('class_size', value)
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select preferred class size" />
                  </SelectTrigger>
                  <SelectContent>
                    {classSizeOptions.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BaseDialog>
  );
};

export default TutorEdit;
