// components/sessions/MaterialUploadDialog.tsx
'use client'

import React, { useState, useTransition } from 'react'
import type { MaterialUploadDialogProps } from '~/lib/sessions/types/upcoming-sessions'
import { Textarea } from "../base-v2/ui/Textarea"
import { FileText, Trash2, Upload } from 'lucide-react'
import BaseDialog from '../base-v2/BaseDialog'
import { FileUploadDropzone } from '../base-v2/FileUploadDropzone'
import { FileUploadItem } from '../base-v2/FileUploadItem'
import { deleteSessionMaterialAction, updateSessionMaterialsAction, uploadSessionMaterialsAction } from '~/lib/sessions/server-actions-v2'
import useCsrfToken from '~/core/hooks/use-csrf-token'
import { getFileBuffer } from '~/lib/utils/upload-material-utils'
import { Button } from '../base-v2/ui/Button'
import useSupabase from '~/core/hooks/use-supabase'
import { toast } from 'sonner'

interface UploadingFile {
  id: string
  file: File
  progress: number
  status: 'uploading' | 'error' | 'complete' | 'waiting'
  error?: string
}

const MaterialUploadDialog: React.FC<MaterialUploadDialogProps> = ({
  showMaterialDialog,
  setShowMaterialDialog,
  sessionId,
  onSuccess,
  existingMaterials = [],
  onUploadStart,
  onUploadComplete
}) => {
  const [isPending, startTransition] = useTransition()
  const csrfToken = useCsrfToken()

  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [description, setDescription] = useState('')
  const [materialsToDelete, setMaterialsToDelete] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadCompleted, setUploadCompleted] = useState(false)

  const supabase = useSupabase();

  const handleFilesAdded = (files: File[]) => {
    if (isUploading) return // Prevent adding files during upload
    
    const newFiles = files.map(file => ({
      id: Math.random().toString(36).slice(2),
      file,
      progress: 0,
      status: 'waiting' as const
    }))
    setUploadingFiles(prev => [...prev, ...newFiles])
  }

  const resetUploadState = () => {
    setUploadingFiles([])
    setIsUploading(false)
    setUploadCompleted(false)
    setDescription('')
    setMaterialsToDelete([])
  }

  const handleDialogClose = () => {
    if (isUploading) return // Prevent closing during upload
    resetUploadState()
    setShowMaterialDialog(false)
  }

  const handleRemoveFile = (fileId: string) => {
    setUploadingFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const uploadFileToSupabase = async (file: File, sessionId: string, fileId: string) => {
    const fileExt = file.name.split('.').pop();
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `materials/${sessionId}/${uniqueFileName}`;

    // Update progress to show upload starting
    setUploadingFiles(prev => 
      prev.map(f => f.id === fileId ? { ...f, progress: 10 } : f)
    );

    const { data, error } = await supabase.storage
      .from('class-materials')
      .upload(filePath, file, { 
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw new Error(error.message);
    }

    // Update progress to show upload completed
    setUploadingFiles(prev => 
      prev.map(f => f.id === fileId ? { ...f, progress: 90 } : f)
    );

    const { data: publicData } = supabase.storage
      .from('class-materials')
      .getPublicUrl(filePath);

    return { publicUrl: publicData.publicUrl, filePath, uniqueFileName };
  };

  const handleUpload = async () => {
    if (uploadingFiles.length === 0) return

    setIsUploading(true)
    setUploadCompleted(false)
    onUploadStart?.() // Call the parent callback

    try {
      // Update all files to uploading status
      setUploadingFiles(prev =>
        prev.map(f => ({ ...f, status: 'uploading' as const }))
      )

      let filesToUpdateInDB = [];
      const totalFiles = uploadingFiles.length;
      let completedFiles = 0;

      // Process files one by one
      for (const uploadingFile of uploadingFiles) {
        if (uploadingFile.status === 'complete') continue
        
        try {
          // Set file to uploading with initial progress
          setUploadingFiles(prev => 
            prev.map(f => f.id === uploadingFile.id 
              ? { ...f, status: 'uploading', progress: 5 } 
              : f
            )
          );

          const { publicUrl, filePath, uniqueFileName} = await uploadFileToSupabase(uploadingFile.file, sessionId, uploadingFile.id)
          
          // Update file status to complete
          setUploadingFiles(prev => 
            prev.map(f => f.id === uploadingFile.id 
              ? { ...f, status: 'complete', progress: 100 } 
              : f
            )
          )
          
          completedFiles++;
          
          // Small delay to make progress visible
          await new Promise(resolve => setTimeout(resolve, 300));
          
          filesToUpdateInDB.push({
            session_id: sessionId,
            name: uploadingFile.file.name,
            file_size: (uploadingFile.file.size / 1024 / 1024).toFixed(2),
            url: publicUrl,
            description: description,
          })
        } catch (error) {
          // Mark individual file as error
          setUploadingFiles(prev => 
            prev.map(f => f.id === uploadingFile.id 
              ? { ...f, status: 'error', error: error instanceof Error ? error.message : 'Upload failed' } 
              : f
            )
          )
        }
      }

      const result = await updateSessionMaterialsAction({ materialData: filesToUpdateInDB })

      if (result.success) {
        setUploadingFiles([]);
        setUploadCompleted(true)
        toast.success(`Successfully uploaded ${filesToUpdateInDB.length} file${filesToUpdateInDB.length > 1 ? 's' : ''}`)
        
        // Close dialog after showing success message for 2 seconds
        setTimeout(() => {
          setShowMaterialDialog(false)
          setUploadCompleted(false)
          setIsUploading(false)
          onUploadComplete?.() // Call the parent callback
        }, 2000)
        
        // Call onSuccess callback if provided
        onSuccess?.()
      } else {
        throw new Error('Failed to save materials to database')
      }
    } catch (error) {
      console.error('Upload failed:', error)
      toast.error('Failed to upload materials. Please try again.')
      setUploadingFiles(prev => 
        prev.map(f => ({ ...f, status: 'error' as const }))
      )
      setIsUploading(false)
      onUploadComplete?.() // Call the parent callback on error too
    }
  }

  const handleDeleteMaterial = async (materialId: string, materialUrl: string) => {
    try {
      startTransition(async () => {
        const result = await deleteSessionMaterialAction({
          materialId,
          materialUrl,
          csrfToken
        })

        if (result.success) {
          setMaterialsToDelete(prev => [...prev, materialId])
          // onSuccess?.()
        }
      })
    } catch (error) {
      console.error('Error deleting material:', error)
    }
  }

  const isValid = uploadingFiles.length > 0 && !isUploading && !uploadCompleted

  // Determine the confirmation button text based on context
  const getConfirmButtonText = () => {
    if (isUploading) {
      return 'Uploading...'
    }
    if (uploadCompleted) {
      return 'Upload Complete!'
    }
    if (uploadingFiles.length > 0) {
      return (
        <>
          <Upload className="h-4 w-4 mr-2" />
          Upload Materials
        </>
      )
    }
    return 'Save Changes'
  }

  return (
    <BaseDialog
      open={showMaterialDialog}
      onClose={handleDialogClose}
      title="Upload Class Materials"
      maxWidth="xl"
      onConfirm={isValid ? handleUpload : undefined}
      confirmButtonText={getConfirmButtonText()}
      loading={isUploading || isPending}
      confirmButtonVariant={isValid ? 'default' : uploadCompleted ? 'secondary' : 'secondary'}
      showCloseButton={!isUploading}
    >
      <div className="space-y-6">
        {/* Upload Section */}
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
            <FileUploadDropzone 
              onFilesAdded={handleFilesAdded} 
              className={isUploading ? 'opacity-50 pointer-events-none' : ''} 
            />
          </div>
          
          {/* Overall Upload Progress */}
          {(isUploading || uploadCompleted) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {uploadCompleted ? (
                    <div className="rounded-full h-4 w-4 bg-green-600 flex items-center justify-center">
                      <svg className="h-2.5 w-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  ) : (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                  )}
                  <span className="text-sm font-medium text-blue-900">
                    {uploadCompleted ? 'Upload Complete!' : 'Uploading materials...'}
                  </span>
                </div>
                <span className="text-xs text-blue-700">
                  {uploadingFiles.filter(f => f.status === 'complete').length} of {uploadingFiles.length} files completed
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    uploadCompleted ? 'bg-green-600' : 'bg-blue-600'
                  }`}
                  style={{ 
                    width: `${(uploadingFiles.filter(f => f.status === 'complete').length / uploadingFiles.length) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Files Section */}
        {(existingMaterials.length > 0 || uploadingFiles.length > 0) && (
          <div className="space-y-4">
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                <FileText size={16} className="mr-2 text-gray-500" />
                Class Materials
                <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {(existingMaterials.filter(material => !materialsToDelete.includes(material.id)).length + uploadingFiles.length)}
                </span>
              </h3>
              
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                {/* Existing Materials */}
                {existingMaterials
                  .filter(material => !materialsToDelete.includes(material.id))
                  .map((material) => (
                    <div
                      key={material.id}
                      className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText size={18} className="text-primary-blue-600" />
                        <div>
                          <p className="text-sm font-medium">{material.name}</p>
                          <p className="text-xs text-neutral-500">{material.file_size} MB</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-neutral-500 hover:text-error hover:bg-error-light"
                        onClick={() => handleDeleteMaterial(material.id, material.url || "")}
                        disabled={isUploading}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}

                {/* Uploading Files */}
                {uploadingFiles.map((file) => (
                  <div key={file.id} className="bg-white border border-gray-200 rounded-lg">
                    <FileUploadItem
                      fileName={file.file.name}
                      fileSize={(file.file.size / 1024 / 1024).toFixed(2)}
                      progress={file.progress}
                      status={file.status}
                      error={file.error}
                      onRemove={isUploading ? undefined : () => handleRemoveFile(file.id)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {existingMaterials.length === 0 && uploadingFiles.length === 0 && (
          <div className="text-center pt-8 pb-2 text-neutral-500 border-t border-gray-200">
            <FileText size={40} className="mx-auto mb-3 text-neutral-400" />
            <p className="font-medium">No materials uploaded yet</p>
            <p className="text-sm">Upload files to share with your students</p>
          </div>
        )}

        {/* <div className="space-y-2 pb-2">
          <label className="text-sm font-medium">Description for Students</label>
          <Textarea
            placeholder="Add a description or instructions for these materials..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="h-24"
          />
        </div> */}
      </div>
    </BaseDialog>
  )
}

export default MaterialUploadDialog