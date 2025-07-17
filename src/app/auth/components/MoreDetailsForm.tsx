'use client';

import { useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import Button from '~/core/ui/Button';
import TextField from '~/core/ui/TextField';
import ImageUploader from '~/core/ui/ImageUploader';
import Logo from '~/core/ui/Logo';
import useSupabase from '~/core/hooks/use-supabase';
import {
  updateProfilePhotoAction,
  updateOnboardingDetailsAction,
} from '../sign-up/moredetails/actions';

interface MoreDetailsFormProps {
  user: User;
  returnUrl?: string;
}

const MoreDetailsForm: React.FC<MoreDetailsFormProps> = ({
  user,
  returnUrl,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{
    dob?: string;
    education?: string;
    subjects?: string;
    classSize?: string;
    document?: string;
  }>({});
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const client = useSupabase();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate form
    const form = e.currentTarget;
    const formData = new FormData(form);
    const dob = formData.get('dob') as string;
    const education = formData.get('education') as string;
    const subjects = formData.get('subjects') as string;
    const classSize = formData.get('classSize') as string;
    const documentNotes = formData.get('documentNotes') as string;
    // Add returnUrl to form data if provided
    if (returnUrl) {
      formData.append('returnUrl', returnUrl);
    }
    const errors: {
      dob?: string;
      education?: string;
      subjects?: string;
      classSize?: string;
      document?: string;
    } = {};
    // Date of birth validation (age 13-100)
    if (!dob) {
      errors.dob = 'Date of birth is required';
    } else {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        // birthday not reached yet this year
        age--;
      }
      if (age < 13 || age > 100) {
        errors.dob = 'Age must be between 13 and 100 years';
      }
    }
    if (!education) {
      errors.education = 'Please select your highest level of education';
    }
    if (!subjects || subjects.trim().length < 3) {
      errors.subjects = 'Please enter subjects you teach';
    }
    if (!classSize) {
      errors.classSize = 'Please select preferred class size';
    }
    // Document upload validation (required for tutors)
    if (!documentFile) {
      errors.document = 'Identity verification document is required';
    } else {
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
      ];
      if (!allowedTypes.includes(documentFile.type)) {
        errors.document = 'Document must be PDF, JPG, JPEG, or PNG';
      }
    }
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }
    setIsSubmitting(true);
    try {
      // Add document file to form data if present
      if (documentFile) {
        formData.append('document', documentFile);
      }
      
      const result = await updateOnboardingDetailsAction(formData);
      
      // Check if the action returned an error response
      if (result && 'error' in result && !result.success) {
        toast.error(result.error);
        return;
      }
      
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error submitting form:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const uploadProfilePhoto = useCallback(
    async (file: File | null) => {
      if (!file) {
        try {
          await updateProfilePhotoAction(user.id, null);
          setPhotoUrl(null);
          toast.success('Profile picture removed');
        } catch (error) {
          toast.error('Failed to remove profile picture');
        }
        return;
      }

      try {
        const bytes = await file.arrayBuffer();
        const bucket = client.storage.from('avatars');
        const extension = file.name.split('.').pop();
        const fileName = `${user.id}.${extension}`;

        const result = await bucket.upload(fileName, bytes, {
          upsert: true,
        });

        if (result.error) {
          throw result.error;
        }

        const {
          data: { publicUrl },
        } = bucket.getPublicUrl(fileName);

        await updateProfilePhotoAction(user.id, publicUrl);

        setPhotoUrl(publicUrl);
        toast.success('Profile picture updated successfully');
      } catch (error) {
        console.error('Error uploading profile photo:', error);
        toast.error('Failed to upload profile picture');
      }
    },
    [client.storage, user.id],
  );

  return (
    <div className="flex flex-col items-center h-[100%] overflow-hidden">
      <div className="flex flex-col items-center w-full mx-auto overflow-y-auto md:overflow-y-hidden">
        <div className="w-full flex-1 flex flex-col justify-center">
          <form onSubmit={handleSubmit} className="space-y-2 px-1">
            <div className="flex flex-col items-center justify-center pt-4">
              <div className="w-full">
                <ImageUploader
                  value={photoUrl}
                  onValueChange={uploadProfilePhoto}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-sm font-medium text-primary">
                      {photoUrl
                        ? 'Change Profile Picture'
                        : 'Upload Profile Picture'}
                    </span>
                    <span className="text-xs text-gray-500 text-center">
                      Choose an image for your profile (optional)
                    </span>
                  </div>
                </ImageUploader>
              </div>
            </div>

            <div className="space-y-2">
              {/* Date of Birth */}
              <TextField>
                <TextField.Label className="mb-1.5 block text-xs sm:text-sm font-medium text-gray-700">
                  Date of Birth
                  {formErrors.dob && (
                    <p className="text-red-500 text-sm">{formErrors.dob}</p>
                  )}
                  <TextField.Input
                    name="dob"
                    required
                    type="date"
                    className="w-full"
                  />
                </TextField.Label>
              </TextField>

              {/* Highest Level of Education */}
              <TextField>
                <TextField.Label className="mb-1.5 block text-xs sm:text-sm font-medium text-gray-700">
                  Highest Level of Education
                  {formErrors.education && (
                    <p className="text-red-500 text-sm">
                      {formErrors.education}
                    </p>
                  )}
                  <select
                    name="education"
                    required
                    className="w-full border rounded px-2 py-2"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Select education level
                    </option>
                    <option value="High School">High School</option>
                    <option value="Associate Degree">Associate Degree</option>
                    <option value="Bachelor's Degree">
                      Bachelor&apos;s Degree
                    </option>
                    <option value="Master's Degree">
                      Master&apos;s Degree
                    </option>
                    <option value="Doctorate">Doctorate</option>
                  </select>
                </TextField.Label>
              </TextField>

              {/* Subjects You Teach */}
              <TextField>
                <TextField.Label className="mb-1.5 block text-xs sm:text-sm font-medium text-gray-700">
                  Subjects You Teach
                  {formErrors.subjects && (
                    <p className="text-red-500 text-sm">
                      {formErrors.subjects}
                    </p>
                  )}
                  <textarea
                    name="subjects"
                    required
                    rows={3}
                    className="w-full border rounded px-2 py-2"
                    placeholder="e.g., Mathematics, Physics, Chemistry (separate with commas or spaces)"
                  />
                </TextField.Label>
              </TextField>

              {/* Preferred Class Size */}
              <TextField>
                <TextField.Label className="mb-1.5 block text-xs sm:text-sm font-medium text-gray-700">
                  Preferred Class Size
                  {formErrors.classSize && (
                    <p className="text-red-500 text-sm">
                      {formErrors.classSize}
                    </p>
                  )}
                  <select
                    name="classSize"
                    required
                    className="w-full border rounded px-2 py-2"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Select class size
                    </option>
                    <option value="1-5">1-5</option>
                    <option value="6-10">6-10</option>
                    <option value="11-20">11-20</option>
                    <option value="21+">21+</option>
                  </select>
                </TextField.Label>
              </TextField>

              {/* Identity Document Upload */}
              <TextField>
                <TextField.Label className="mb-1.5 block text-xs sm:text-sm font-medium text-gray-700">
                  Identity Verification Document *
                  {formErrors.document && (
                    <p className="text-red-500 text-sm">
                      {formErrors.document}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mb-2">
                    Upload a government-issued ID, passport, or professional
                    certificate for identity verification (required)
                  </p>
                  <input
                    type="file"
                    name="document"
                    required
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="w-full border rounded px-2 py-2 mb-2"
                    onChange={(e) => {
                      setDocumentFile(e.target.files?.[0] || null);
                    }}
                  />
                </TextField.Label>
              </TextField>

              <div className="pt-2">
                <Button
                  type="submit"
                  loading={isSubmitting}
                  className={
                    'w-full btn bg-secondary-600 text-white hover:bg-secondary-500 focus:ring-secondary-500/50 bg-gradient-to-br from-secondary-500 to-secondary-600'
                  }
                >
                  Complete Profile & Continue
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MoreDetailsForm;
