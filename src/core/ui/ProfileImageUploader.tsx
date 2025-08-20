'use client';

import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { PhotoIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

import ImageUploadInput from '~/core/ui/ImageUploadInput';
import Button from '~/core/ui/Button';
import ProfilePictureCropModal from '~/core/ui/ProfilePictureCropModal';

function ProfileImageUploader(
  props: React.PropsWithChildren<{
    value: string | null | undefined;
    onValueChange: (value: File | null) => unknown;
  }>,
) {
  const [image, setImage] = useState(props.value);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);

  const { setValue, register } = useForm<{
    value: string | null | FileList;
  }>({
    defaultValues: {
      value: props.value,
    },
    mode: 'onChange',
    reValidateMode: 'onChange',
  });

  const control = register('value');

  const onClear = useCallback(async () => {
    props.onValueChange(null);
    setValue('value', null);
    setImage('');
    setSelectedFile(null);
  }, [props, setValue]);

  // Handle file selection - open crop modal instead of directly uploading
  const onFileSelect = useCallback(
    ({ file }: { image: string; file: File }) => {
      setSelectedFile(file);
      setIsCropModalOpen(true);
    },
    [],
  );

  // Handle cropped image completion
  const onCropComplete = useCallback(
    (croppedFile: File) => {
      // Create preview URL for the cropped image
      const imageUrl = URL.createObjectURL(croppedFile);
      setImage(imageUrl);
      
      // Pass the cropped file to the parent
      props.onValueChange(croppedFile);
      
      // Update form value
      setValue('value', imageUrl);
      
      // Clean up
      setSelectedFile(null);
    },
    [props, setValue],
  );

  const onCropModalClose = useCallback(() => {
    setIsCropModalOpen(false);
    setSelectedFile(null);
  }, []);

  const Input = () => (
    <ImageUploadInput
      {...control}
      accept={'image/*'}
      className={'absolute w-full h-full'}
      visible={false}
      multiple={false}
      onValueChange={onFileSelect}
    />
  );

  if (!image) {
    return (
      <>
        <FallbackImage descriptionSection={props.children}>
          <Input />
        </FallbackImage>
        
        <ProfilePictureCropModal
          isOpen={isCropModalOpen}
          onClose={onCropModalClose}
          onCropComplete={onCropComplete}
          selectedFile={selectedFile}
        />
      </>
    );
  }

  return (
    <>
      <div className={'flex space-x-4 items-center'}>
        <label className={'w-20 h-20 relative animate-in fade-in zoom-in-50'}>
          <Image
            fill
            className={'w-20 h-20 rounded-full object-cover'}
            src={image as string}
            alt={'Profile picture'}
          />

          <Input />
        </label>

        <div>
          <Button onClick={onClear} size={'small'} variant={'ghost'}>
            Remove Image
          </Button>
        </div>
      </div>

      <ProfilePictureCropModal
        isOpen={isCropModalOpen}
        onClose={onCropModalClose}
        onCropComplete={onCropComplete}
        selectedFile={selectedFile}
      />
    </>
  );
}

export default ProfileImageUploader;

function FallbackImage(
  props: React.PropsWithChildren<{
    descriptionSection?: React.ReactNode;
  }>,
) {
  return (
    <div className={'flex space-x-4 items-center'}>
      <label
        className={
          'w-20 h-20 relative flex flex-col justify-center rounded-full border border-border cursor-pointer hover:border-primary animate-in fade-in zoom-in-50'
        }
      >
        <PhotoIcon className={'h-8 text-primary'} />

        {props.children}
      </label>

      {props.descriptionSection}
    </div>
  );
}