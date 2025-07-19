// components/base-v2/FileUploadItem.tsx
import React from 'react'
import { Button } from "./ui/Button"
import { ProgressBar } from "./ui/ProgressBar"
import { File, X, AlertCircle, CheckCircle2 } from 'lucide-react'

interface FileUploadItemProps {
  fileName: string
  fileSize: string
  progress?: number
  status: 'uploading' | 'error' | 'complete' | 'waiting'
  error?: string
  onRemove: () => void
}

const FileUploadItem: React.FC<FileUploadItemProps> = ({
  fileName,
  fileSize,
  progress = 0,
  status,
  error,
  onRemove
}) => {
  return (
    <div className="flex flex-col gap-2 bg-gray-50 p-3 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <File className="h-4 w-4 text-blue-600" />
          <div>
            <p className="text-sm font-medium">{fileName}</p>
            <p className="text-xs text-gray-600">{fileSize} MB</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {status === 'error' && (
            <AlertCircle className="h-4 w-4 text-red-500" />
          )}
          {status === 'complete' && (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700"
            onClick={onRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {status === 'uploading' && (
        <ProgressBar
          value={progress}
          className="h-1"
          indicatorClassName="bg-blue-600"
        />
      )}
      
      {status === 'error' && error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}

export { FileUploadItem }