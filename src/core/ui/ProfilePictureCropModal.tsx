'use client';

import React, { useState, useRef, useCallback } from 'react';
import ReactCrop, {
  type Crop,
  centerCrop,
  makeAspectCrop,
  convertToPixelCrop,
} from 'react-image-crop';
import Modal from '~/core/ui/Modal';
import Button from '~/core/ui/Button';

import 'react-image-crop/dist/ReactCrop.css';

interface ProfilePictureCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCropComplete: (croppedFile: File) => void;
  selectedFile: File | null;
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

const ProfilePictureCropModal: React.FC<ProfilePictureCropModalProps> = ({
  isOpen,
  onClose,
  onCropComplete,
  selectedFile,
}) => {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth: width, naturalHeight: height } = e.currentTarget;
    const crop = centerAspectCrop(width, height, 1); // 1:1 aspect ratio for profile pics
    setCrop(crop);
    setCompletedCrop(crop);
  }, []);

  // Update canvas preview when crop changes
  React.useEffect(() => {
    if (!completedCrop || !imgRef.current || !canvasRef.current) {
      return;
    }

    const image = imgRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return;
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const pixelRatio = window.devicePixelRatio || 1;

    const cropX = completedCrop.x * scaleX;
    const cropY = completedCrop.y * scaleY;
    const cropWidth = completedCrop.width * scaleX;
    const cropHeight = completedCrop.height * scaleY;

    canvas.width = 80 * pixelRatio;
    canvas.height = 80 * pixelRatio;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      80,
      80,
    );
  }, [completedCrop]);

  // Load image when file changes
  React.useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setImageUrl(null);
    }
  }, [selectedFile]);

  const getCroppedImg = useCallback(async (): Promise<File | null> => {
    const image = imgRef.current;
    const canvas = canvasRef.current;
    
    if (!image || !canvas || !completedCrop || !selectedFile) {
      return null;
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return null;
    }

    const pixelRatio = window.devicePixelRatio || 1;
    const cropX = completedCrop.x * scaleX;
    const cropY = completedCrop.y * scaleY;
    const cropWidth = completedCrop.width * scaleX;
    const cropHeight = completedCrop.height * scaleY;

    // Set canvas size (square aspect ratio)
    const size = 400; // Output size
    canvas.width = size * pixelRatio;
    canvas.height = size * pixelRatio;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    // Draw the cropped image
    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      size,
      size,
    );

    // Convert canvas to file
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(null);
            return;
          }
          const file = new File([blob], selectedFile.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(file);
        },
        'image/jpeg',
        0.9,
      );
    });
  }, [completedCrop, selectedFile]);

  const handleCropConfirm = useCallback(async () => {
    if (!completedCrop) return;
    
    setIsProcessing(true);
    try {
      const croppedFile = await getCroppedImg();
      if (croppedFile) {
        onCropComplete(croppedFile);
        onClose();
      }
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [completedCrop, getCroppedImg, onCropComplete, onClose]);

  const handleClose = useCallback(() => {
    setCrop(undefined);
    setCompletedCrop(undefined);
    setImageUrl(null);
    onClose();
  }, [onClose]);

  return (
    <Modal
      isOpen={isOpen}
      setIsOpen={handleClose}
      heading="Crop Profile Picture"
    >
      <div className="space-y-4">
        <div className="text-sm text-gray-600">
          Adjust the crop area to select the part of your image you want to use as your profile picture.
        </div>

        {imageUrl && (
          <div className="flex flex-col items-center space-y-4">
            <div className="max-h-96 overflow-hidden">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1}
                circularCrop={false}
                keepSelection={true}
                minWidth={50}
                minHeight={50}
              >
                <img
                  ref={imgRef}
                  src={imageUrl}
                  alt="Crop preview"
                  onLoad={onImageLoad}
                  style={{ maxHeight: '400px', maxWidth: '100%' }}
                />
              </ReactCrop>
            </div>

            {/* Preview */}
            {completedCrop && (
              <div className="flex flex-col items-center space-y-2">
                <div className="text-sm font-medium text-gray-700">Preview:</div>
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200">
                  <canvas
                    ref={canvasRef}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCropConfirm}
            loading={isProcessing}
            disabled={!completedCrop}
          >
            Use This Image
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ProfilePictureCropModal;