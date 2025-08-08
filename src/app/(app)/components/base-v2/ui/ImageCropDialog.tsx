'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './Dialog';
import { Button } from './Button';

interface ImageCropDialogProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string;
  onCropComplete: (croppedFile: File) => void;
  aspectRatio?: number; // width/height ratio, default 1 for square
}

export const ImageCropDialog: React.FC<ImageCropDialogProps> = ({
  open,
  onClose,
  imageUrl,
  onCropComplete,
  aspectRatio = 1,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cropArea, setCropArea] = useState({
    x: 50,
    y: 50,
    width: 200,
    height: 200,
  });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [originalImageSize, setOriginalImageSize] = useState({
    width: 0,
    height: 0,
  });
  const [canvasSize, setCanvasSize] = useState({ width: 400, height: 400 });

  // Initialize crop area when image loads
  useEffect(() => {
    if (imageLoaded && imageRef.current) {
      const img = imageRef.current;
      const containerSize = 400;

      // Calculate display size maintaining aspect ratio
      let displayWidth = containerSize;
      let displayHeight = containerSize;

      if (img.naturalWidth > img.naturalHeight) {
        displayHeight = (img.naturalHeight / img.naturalWidth) * containerSize;
      } else {
        displayWidth = (img.naturalWidth / img.naturalHeight) * containerSize;
      }

      setCanvasSize({ width: displayWidth, height: displayHeight });
      setOriginalImageSize({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });

      // Initialize crop area in center with 1:1 aspect ratio
      const minDimension = Math.min(displayWidth, displayHeight);
      const cropSize = minDimension * 0.6;

      setCropArea({
        x: (displayWidth - cropSize) / 2,
        y: (displayHeight - cropSize) / 2,
        width: cropSize,
        height: cropSize, // Force 1:1 aspect ratio
      });
    }
  }, [imageLoaded, aspectRatio]);

  // Draw on canvas
  useEffect(() => {
    if (!imageLoaded || !imageRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;

    if (!ctx) return;

    // Set canvas size
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw image
    ctx.drawImage(img, 0, 0, canvasSize.width, canvasSize.height);

    // Draw overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Clear crop area
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);

    // Draw crop border
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.strokeRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);

    // Draw corner handles
    const handleSize = 10;
    ctx.fillStyle = '#3b82f6';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;

    // Corner handles for resizing
    const handles = [
      { x: cropArea.x - handleSize / 2, y: cropArea.y - handleSize / 2, cursor: 'nw-resize', handle: 'nw' }, // top-left
      {
        x: cropArea.x + cropArea.width - handleSize / 2,
        y: cropArea.y - handleSize / 2,
        cursor: 'ne-resize',
        handle: 'ne'
      }, // top-right
      {
        x: cropArea.x - handleSize / 2,
        y: cropArea.y + cropArea.height - handleSize / 2,
        cursor: 'sw-resize',
        handle: 'sw'
      }, // bottom-left
      {
        x: cropArea.x + cropArea.width - handleSize / 2,
        y: cropArea.y + cropArea.height - handleSize / 2,
        cursor: 'se-resize',
        handle: 'se'
      }, // bottom-right
    ];

    handles.forEach((handle) => {
      ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
      ctx.strokeRect(handle.x, handle.y, handleSize, handleSize);
    });
  }, [cropArea, canvasSize, imageLoaded]);

  const getHandleAtPosition = useCallback((x: number, y: number) => {
    const handleSize = 10;
    const handles = [
      { x: cropArea.x - handleSize / 2, y: cropArea.y - handleSize / 2, handle: 'nw' },
      { x: cropArea.x + cropArea.width - handleSize / 2, y: cropArea.y - handleSize / 2, handle: 'ne' },
      { x: cropArea.x - handleSize / 2, y: cropArea.y + cropArea.height - handleSize / 2, handle: 'sw' },
      { x: cropArea.x + cropArea.width - handleSize / 2, y: cropArea.y + cropArea.height - handleSize / 2, handle: 'se' },
    ];

    for (const handle of handles) {
      if (x >= handle.x && x <= handle.x + handleSize && y >= handle.y && y <= handle.y + handleSize) {
        return handle.handle;
      }
    }
    return null;
  }, [cropArea]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setDragStart({ x, y });

      // Check if clicking on a resize handle
      const handle = getHandleAtPosition(x, y);
      if (handle) {
        setIsResizing(true);
        setResizeHandle(handle);
        return;
      }

      // Check if click is inside crop area for dragging
      if (
        x >= cropArea.x &&
        x <= cropArea.x + cropArea.width &&
        y >= cropArea.y &&
        y <= cropArea.y + cropArea.height
      ) {
        setIsDragging(true);
      }
    },
    [cropArea, getHandleAtPosition],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (isResizing && resizeHandle) {
        const deltaX = x - dragStart.x;
        const deltaY = y - dragStart.y;

        setCropArea((prev) => {
          let newX = prev.x;
          let newY = prev.y;
          let newSize = Math.min(prev.width, prev.height); // Start with current size

          // Calculate new size based on handle and maintain 1:1 aspect ratio
          switch (resizeHandle) {
            case 'nw':
              newSize = Math.max(20, Math.min(prev.width - deltaX, prev.height - deltaY));
              newX = prev.x + prev.width - newSize;
              newY = prev.y + prev.height - newSize;
              break;
            case 'ne':
              newSize = Math.max(20, Math.min(prev.width + deltaX, prev.height - deltaY));
              newX = prev.x;
              newY = prev.y + prev.height - newSize;
              break;
            case 'sw':
              newSize = Math.max(20, Math.min(prev.width - deltaX, prev.height + deltaY));
              newX = prev.x + prev.width - newSize;
              newY = prev.y;
              break;
            case 'se':
              newSize = Math.max(20, Math.min(prev.width + deltaX, prev.height + deltaY));
              newX = prev.x;
              newY = prev.y;
              break;
          }

          // Ensure crop area stays within canvas bounds
          newX = Math.max(0, Math.min(newX, canvasSize.width - newSize));
          newY = Math.max(0, Math.min(newY, canvasSize.height - newSize));

          // Ensure minimum size
          newSize = Math.max(20, newSize);
          
          // Ensure crop area doesn't exceed canvas bounds
          if (newX + newSize > canvasSize.width) {
            newSize = canvasSize.width - newX;
          }
          if (newY + newSize > canvasSize.height) {
            newSize = canvasSize.height - newY;
          }

          return {
            x: newX,
            y: newY,
            width: newSize,
            height: newSize, // Always maintain 1:1 aspect ratio
          };
        });

        // Update drag start for next move
        setDragStart({ x, y });
      } else if (isDragging) {
        const deltaX = x - dragStart.x;
        const deltaY = y - dragStart.y;

        setCropArea((prev) => {
          const newX = Math.max(
            0,
            Math.min(prev.x + deltaX, canvasSize.width - prev.width),
          );
          const newY = Math.max(
            0,
            Math.min(prev.y + deltaY, canvasSize.height - prev.height),
          );

          return {
            ...prev,
            x: newX,
            y: newY,
          };
        });

        // Update drag start for next move
        setDragStart({ x, y });
      } else {
        // Update cursor based on position
        const handle = getHandleAtPosition(x, y);
        if (handle) {
          const cursors: Record<string, string> = {
            nw: 'nw-resize',
            ne: 'ne-resize',
            sw: 'sw-resize',
            se: 'se-resize',
          };
          canvas.style.cursor = cursors[handle];
        } else if (
          x >= cropArea.x &&
          x <= cropArea.x + cropArea.width &&
          y >= cropArea.y &&
          y <= cropArea.y + cropArea.height
        ) {
          canvas.style.cursor = 'move';
        } else {
          canvas.style.cursor = 'default';
        }
      }
    },
    [isDragging, isResizing, resizeHandle, dragStart, cropArea, canvasSize, getHandleAtPosition],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  }, []);

  const handleCrop = useCallback(async () => {
    if (!imageRef.current || !canvasRef.current) return;

    const img = imageRef.current;

    // Create a new canvas for the cropped image
    const cropCanvas = document.createElement('canvas');
    const cropCtx = cropCanvas.getContext('2d');

    if (!cropCtx) return;

    // Calculate the crop coordinates in the original image
    const scaleX = originalImageSize.width / canvasSize.width;
    const scaleY = originalImageSize.height / canvasSize.height;

    const sourceX = cropArea.x * scaleX;
    const sourceY = cropArea.y * scaleY;
    const sourceWidth = cropArea.width * scaleX;
    const sourceHeight = cropArea.height * scaleY;

    // Set output size (fixed profile picture size)
    const outputSize = 400;
    cropCanvas.width = outputSize;
    cropCanvas.height = outputSize;

    // Draw cropped and resized image
    cropCtx.drawImage(
      img,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      outputSize,
      outputSize,
    );

    // Convert canvas to blob and then to File
    cropCanvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], 'cropped-profile.jpg', {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          onCropComplete(file);
          onClose();
        }
      },
      'image/jpeg',
      0.9,
    );
  }, [cropArea, originalImageSize, canvasSize, onCropComplete, onClose]);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const handleDialogClose = useCallback(() => {
    setImageLoaded(false);
    onClose();
  }, [onClose]);

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Crop Profile Picture</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Crop preview"
              className="hidden"
              onLoad={handleImageLoad}
            />

            {imageLoaded && (
              <canvas
                ref={canvasRef}
                className="border border-gray-300 cursor-move"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
            )}

            {!imageLoaded && (
              <div className="w-96 h-96 bg-gray-100 flex items-center justify-center">
                <p className="text-gray-500">Loading image...</p>
              </div>
            )}
          </div>

          <p className="text-sm text-gray-600 text-center">
            Drag to move the crop area or use the corner handles to resize it.<br />
            The crop area maintains a 1:1 aspect ratio for profile pictures.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleDialogClose}>
            Cancel
          </Button>
          <Button onClick={handleCrop} disabled={!imageLoaded}>
            Crop & Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
