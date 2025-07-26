'use client';

import { useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import Button from '~/core/ui/Button';
import TextField from '~/core/ui/TextField';
import ImageUploader from '~/core/ui/ImageUploader';
import Logo from '~/core/ui/Logo';
import useSupabase from '~/core/hooks/use-supabase';
import { CLASS_SIZE_OPTIONS } from '~/lib/constants-v2';
import {
  updateProfilePhotoAction,
  updateOnboardingDetailsAction,
  uploadIdentityProofAction,
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
      // First upload the identity proof file using the new upload action
      if (documentFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('identityFile', documentFile);

        const identityUploadResult =
          await uploadIdentityProofAction(uploadFormData);

        if (!identityUploadResult.success) {
          throw new Error(
            identityUploadResult.error || 'Failed to upload identity proof',
          );
        }

        // Now update the onboarding details with the identity URL
        formData.append('identityUrl', identityUploadResult.url || '');
      }

      await updateOnboardingDetailsAction(formData);

      // If we reach here, there was no redirect (which means success)
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error submitting form:', error);

      // Check if this is a redirect error (which is actually success)
      if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
        // This is a successful redirect, don't show error
        return;
      }

      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to update profile. Please try again.';
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
                    min={
                      new Date(
                        new Date().getFullYear() - 100,
                        new Date().getMonth(),
                        new Date().getDate(),
                      )
                        .toISOString()
                        .split('T')[0]
                    }
                    max={
                      new Date(
                        new Date().getFullYear() - 13,
                        new Date().getMonth(),
                        new Date().getDate(),
                      )
                        .toISOString()
                        .split('T')[0]
                    }
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
                    {CLASS_SIZE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
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
                  <div
                    className={`w-full border-2 border-dashed rounded-lg p-6 text-center transition-colors h-32 flex flex-col items-center justify-center ${
                      formErrors.document
                        ? 'border-red-300 bg-red-50'
                        : documentFile
                          ? 'border-green-300 bg-green-50'
                          : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (!formErrors.document) {
                        e.currentTarget.classList.add(
                          'border-blue-400',
                          'bg-blue-50',
                        );
                      }
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove(
                        'border-blue-400',
                        'bg-blue-50',
                      );
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove(
                        'border-blue-400',
                        'bg-blue-50',
                      );
                      const files = e.dataTransfer.files;
                      if (files.length > 0) {
                        const file = files[0];

                        // Validate file type
                        const allowedTypes = [
                          'application/pdf',
                          'image/jpeg',
                          'image/jpg',
                          'image/png',
                        ];

                        if (!allowedTypes.includes(file.type)) {
                          setFormErrors((prev) => ({
                            ...prev,
                            document: 'Document must be PDF, JPG, JPEG, or PNG',
                          }));
                          return;
                        }

                        // Validate file size (10MB limit)
                        if (file.size > 10 * 1024 * 1024) {
                          setFormErrors((prev) => ({
                            ...prev,
                            document: 'File size must be less than 10MB',
                          }));
                          return;
                        }

                        // Clear any previous errors and set the file
                        setFormErrors((prev) => ({
                          ...prev,
                          document: undefined,
                        }));
                        setDocumentFile(file);

                        // Also update the hidden input so FormData can access it
                        const fileInput = document.getElementById(
                          'document-upload',
                        ) as HTMLInputElement;
                        if (fileInput) {
                          // Create a new FileList with the dropped file
                          const dataTransfer = new DataTransfer();
                          dataTransfer.items.add(file);
                          fileInput.files = dataTransfer.files;
                          // File added to input via drag and drop
                        }
                      }
                    }}
                  >
                    <input
                      type="file"
                      name="document"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      id="document-upload"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // Validate file type
                          const allowedTypes = [
                            'application/pdf',
                            'image/jpeg',
                            'image/jpg',
                            'image/png',
                          ];

                          if (!allowedTypes.includes(file.type)) {
                            setFormErrors((prev) => ({
                              ...prev,
                              document:
                                'Document must be PDF, JPG, JPEG, or PNG',
                            }));
                            e.target.value = ''; // Clear the input
                            return;
                          }

                          // Validate file size (10MB limit)
                          if (file.size > 10 * 1024 * 1024) {
                            setFormErrors((prev) => ({
                              ...prev,
                              document: 'File size must be less than 10MB',
                            }));
                            e.target.value = ''; // Clear the input
                            return;
                          }

                          // Clear any previous errors and set the file
                          setFormErrors((prev) => ({
                            ...prev,
                            document: undefined,
                          }));
                          setDocumentFile(file);
                        }
                      }}
                    />
                    <label
                      htmlFor="document-upload"
                      className="cursor-pointer flex flex-col items-center justify-center w-full h-full"
                    >
                      {documentFile ? (
                        <div className="w-full">
                          <div className="flex items-center justify-center mb-2">
                            <svg
                              className="w-8 h-8 text-green-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                          <p className="text-sm text-green-700 font-medium mb-1">
                            {documentFile.name}
                          </p>
                          <p className="text-xs text-green-600 mb-2">
                            Click to change file
                          </p>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDocumentFile(null);
                              const fileInput = document.getElementById(
                                'document-upload',
                              ) as HTMLInputElement;
                              if (fileInput) fileInput.value = '';
                            }}
                            className="text-xs text-red-600 hover:text-red-800 underline"
                          >
                            Remove file
                          </button>
                        </div>
                      ) : (
                        <>
                          {formErrors.document ? (
                            <>
                              <svg
                                className="w-8 h-8 text-red-400 mb-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                                />
                              </svg>
                              <p className="text-sm text-red-600 font-medium">
                                Upload failed
                              </p>
                              <p className="text-xs text-red-500">
                                Click to try again
                              </p>
                            </>
                          ) : (
                            <>
                              <svg
                                className="w-8 h-8 text-gray-400 mb-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                />
                              </svg>
                              <p className="text-sm text-gray-600 font-medium">
                                Upload your document
                              </p>
                              <p className="text-xs text-gray-500">
                                Drag and drop or click to browse
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                PDF, JPG, JPEG, PNG (Max 10MB)
                              </p>
                            </>
                          )}
                        </>
                      )}
                    </label>
                  </div>
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
