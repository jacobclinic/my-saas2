// components/base-v2/FileUploadItem.tsx
import React, { useState } from 'react'
import { Button } from "./ui/Button"
import { Input } from "./ui/Input"
import { ProgressBar } from "./ui/ProgressBar"
import { File, X, AlertCircle, CheckCircle2, Edit3, Check } from 'lucide-react'

interface FileUploadItemProps {
  fileName: string
  fileSize: string
  progress?: number
  status: 'uploading' | 'error' | 'complete' | 'waiting'
  error?: string
  onRemove?: () => void
  onRename?: (newName: string) => void
  allowRename?: boolean
}

const FileUploadItem: React.FC<FileUploadItemProps> = ({
  fileName,
  fileSize,
  progress = 0,
  status,
  error,
  onRemove,
  onRename,
  allowRename = false
}) => {
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(fileName)

  const handleStartRename = () => {
    setIsRenaming(true)
    setRenameValue(fileName)
  }

  const handleConfirmRename = () => {
    if (renameValue.trim() && renameValue !== fileName && onRename) {
      onRename(renameValue.trim())
    }
    setIsRenaming(false)
  }

  const handleCancelRename = () => {
    setIsRenaming(false)
    setRenameValue(fileName)
  }

  const canRename = allowRename && status === 'waiting' && !isRenaming

  return (
    <div className="flex flex-col gap-2 bg-gray-50 p-3 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          <File className="h-4 w-4 text-blue-600" />
          <div className="flex-1">
            {isRenaming ? (
              <div className="flex items-center gap-2">
                <Input
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  className="text-sm font-medium h-7"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleConfirmRename()
                    } else if (e.key === 'Escape') {
                      handleCancelRename()
                    }
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-green-600 hover:bg-green-100"
                  onClick={handleConfirmRename}
                >
                  <Check size={12} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-gray-500 hover:bg-gray-100"
                  onClick={handleCancelRename}
                >
                  <X size={12} />
                </Button>
              </div>
            ) : (
              <>
                <p className="text-sm font-medium">{fileName}</p>
                <p className="text-xs text-gray-600">{fileSize} MB</p>
              </>
            )}
          </div>
        </div>
        
        {!isRenaming && (
          <div className="flex items-center gap-1">
            {status === 'error' && (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
            {status === 'complete' && (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            )}
            {canRename && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-blue-600 hover:bg-blue-50"
                onClick={handleStartRename}
                title="Rename file"
              >
                <Edit3 className="h-3 w-3" />
              </Button>
            )}
            {onRemove && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-red-600 hover:bg-red-50"
                onClick={onRemove}
                title="Remove file"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
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