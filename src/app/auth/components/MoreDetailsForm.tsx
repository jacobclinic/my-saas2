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
  updateUserDetailsAction,
} from '../sign-up/moredetails/actions';

interface MoreDetailsFormProps {
  user: User;
}

const MoreDetailsForm: React.FC<MoreDetailsFormProps> = ({ user }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{
    displayName?: string;
    names?: string;
    phoneNumber?: string;
    address?: string;
  }>({});
  const client = useSupabase();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate form
    const form = e.currentTarget;
    const formData = new FormData(form);
    const displayName = formData.get('displayName') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const phoneNumber = formData.get('phoneNumber') as string;

    const errors: {
      displayName?: string;
      names?: string;
      phoneNumber?: string;
    } = {};

    if (!displayName || displayName.trim().length < 3) {
      errors.displayName = 'Display name must be at least 3 characters';
    }

    if (!firstName || firstName.trim().length < 3) {
      errors.names = 'Names must be at least 3 characters';
    }

    if (!lastName || lastName.trim().length < 3) {
      errors.names = 'Names must be at least 3 characters';
    }

    if (!phoneNumber || phoneNumber.trim().length < 10) {
      errors.phoneNumber = 'Please enter a valid phone number';
    } else if (
      !/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/.test(
        phoneNumber,
      )
    ) {
      errors.phoneNumber = 'Please enter a valid phone number';
    }

    setFormErrors(errors);

    // If there are errors, don't submit the form
    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      await updateUserDetailsAction(formData);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to update profile. Please try again.');
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
      <div className="flex flex-col items-center w-full max-w-5xl mx-auto h-[70vh] overflow-y-auto md:overflow-y-hidden">
        <div className="w-full px-4 flex-1 flex flex-col justify-center">
          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="flex flex-col items-center justify-center pt-4">
              <div className="w-full max-w-xs">
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
              <TextField>
                <TextField.Label>
                  Display Name
                  {formErrors.displayName && (
                    <p className="text-red-500 text-sm">
                      {formErrors.displayName}
                    </p>
                  )}
                  <TextField.Input
                    name="displayName"
                    required
                    minLength={2}
                    placeholder="How you want to be known"
                    defaultValue={user.email?.split('@')[0] || ''}
                  />
                </TextField.Label>
              </TextField>
              {formErrors.names && (
                <p className="text-red-500 text-sm">{formErrors.names}</p>
              )}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <TextField>
                  <TextField.Label>
                    First Name
                    <TextField.Input
                      name="firstName"
                      required
                      minLength={2}
                      placeholder="Your first name"
                    />
                  </TextField.Label>
                </TextField>

                <TextField>
                  <TextField.Label>
                    Last Name
                    <TextField.Input
                      name="lastName"
                      required
                      minLength={2}
                      placeholder="Your last name"
                    />
                  </TextField.Label>
                </TextField>
              </div>

              <TextField>
                <TextField.Label>
                  Phone Number
                  {formErrors.phoneNumber && (
                    <p className="text-red-500 text-sm">
                      {formErrors.phoneNumber}
                    </p>
                  )}
                  <TextField.Input
                    name="phoneNumber"
                    required
                    type="tel"
                    placeholder="Your phone number"
                  />
                </TextField.Label>
              </TextField>

              <TextField>
                <TextField.Label>
                  Address
                  {formErrors.address && (
                    <p className="text-red-500 text-sm">{formErrors.address}</p>
                  )}
                  <TextField.Input
                    name="address"
                    placeholder="Your address (optional)"
                  />
                </TextField.Label>
              </TextField>

              <div className="pt-2">
                <Button
                  type="submit"
                  loading={isSubmitting}
                  className="w-full py-2 text-base font-medium"
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
