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
  returnUrl?: string;
}

const MoreDetailsForm: React.FC<MoreDetailsFormProps> = ({
  user,
  returnUrl,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{
    displayName?: string;
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
    const phoneNumber = formData.get('phoneNumber') as string;
    const address = formData.get('address') as string;

    // Add returnUrl to form data if provided
    if (returnUrl) {
      formData.append('returnUrl', returnUrl);
    }

    const errors: {
      displayName?: string;
      phoneNumber?: string;
      address?: string;
    } = {};

    if (!displayName || displayName.trim().length < 3) {
      errors.displayName = 'Display name must be at least 3 characters';
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

    if (!address || address.trim().length < 5) {
      errors.address = 'address must be at least 5 characters';
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
              <TextField>
                <TextField.Label className="mb-1.5 block text-xs sm:text-sm font-medium text-gray-700">
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

              <TextField>
                <TextField.Label className="mb-1.5 block text-xs sm:text-sm font-medium text-gray-700">
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
                <TextField.Label className="mb-1.5 block text-xs sm:text-sm font-medium text-gray-700">
                  Address
                  {formErrors.address && (
                    <p className="text-red-500 text-sm">{formErrors.address}</p>
                  )}
                  <TextField.Input
                    name="address"
                    required
                    placeholder="Your address"
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
