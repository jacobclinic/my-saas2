'use client';

import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { PhotoIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

import ImageUploadInput from '~/core/ui/ImageUploadInput';
import Button from '~/core/ui/Button';

function ImageUploader(
  props: React.PropsWithChildren<{
    value: string | null | undefined;
    onValueChange: (value: File | null) => unknown;
  }>,
) {
  const [image, setImage] = useState(props.value);

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
  }, [props, setValue]);

  const onValueChange = useCallback(
    async ({ image, file }: { image: string; file: File }) => {
      props.onValueChange(file);

      setImage(image);
    },
    [props],
  );

  const Input = () => (
    <ImageUploadInput
      {...control}
      accept={'image/*'}
      className={'absolute w-full h-full'}
      visible={false}
      multiple={false}
      onValueChange={onValueChange}
    />
  );

  if (!image) {
    return (
      <div className="w-full min-w-0">
        <FallbackImage descriptionSection={props.children}>
          <Input />
        </FallbackImage>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0">
      <div className={'flex space-x-4 items-center justify-center'}>
        <label className={'w-20 h-20 relative animate-in fade-in zoom-in-50'}>
          <Image
            fill
            className={'w-20 h-20 rounded-full object-cover'}
            src={image as string}
            alt={''}
          />

          <Input />
        </label>

        <div>
          <Button onClick={onClear} size={'small'} variant={'ghost'}>
            Remove Image
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ImageUploader;

function FallbackImage(
  props: React.PropsWithChildren<{
    descriptionSection?: React.ReactNode;
  }>,
) {
  return (
    <div className={'flex space-x-4 items-center justify-center w-full'}>
      <label
        className={
          'w-20 h-20 relative flex flex-col justify-center rounded-full border border-border cursor-pointer hover:border-primary animate-in fade-in zoom-in-50'
        }
      >
        <PhotoIcon className={'h-8 text-primary mx-auto'} />

        {props.children}
      </label>

      <div className="flex flex-col items-start">
        {props.descriptionSection}
      </div>
    </div>
  );
}
