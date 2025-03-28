// components/base-v2/FileUploadDropzone.tsx
import React, { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload } from 'lucide-react'
import { cn } from "../../lib/utils"

interface FileUploadDropzoneProps {
  onFilesAdded: (files: File[]) => void
  maxSize?: number
  accept?: Record<string, string[]>
  maxFiles?: number
  className?: string
}

const FileUploadDropzone: React.FC<FileUploadDropzoneProps> = ({
  onFilesAdded,
  maxSize = 5242880, // 5MB
  accept = {
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.ms-powerpoint': ['.ppt'],
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
    'image/*': ['.png', '.jpg', '.jpeg']
  },
  maxFiles = 10,
  className
}) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onFilesAdded(acceptedFiles)
  }, [onFilesAdded])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize,
    accept,
    maxFiles
  })

  return (
    <div
      {...getRootProps()}
      className={cn(
        "flex items-center justify-center h-32 border-2 border-dashed rounded-lg transition-colors cursor-pointer",
        isDragActive ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-gray-300",
        className
      )}
    >
      <input {...getInputProps()} />
      <div className="text-center">
        <Upload className="mx-auto h-8 w-8 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          {isDragActive ? "Drop files here" : "Drop files or click to upload"}
        </p>
        <p className="text-xs text-gray-500">
          PDF, DOC, PPT, or images up to 5MB
        </p>
      </div>
    </div>
  )
}

export { FileUploadDropzone }