// components/sessions/MaterialUploadDialog.tsx
'use client'

import React, { useState, useTransition } from 'react'
import type { MaterialUploadDialogProps } from '~/lib/sessions/types/upcoming-sessions'
import { Textarea } from "../base-v2/ui/Textarea"
import { Trash, Upload } from 'lucide-react'
import BaseDialog from '../base-v2/BaseDialog'
import { FileUploadDropzone } from '../base-v2/FileUploadDropzone'
import { FileUploadItem } from '../base-v2/FileUploadItem'
import { deleteSessionMaterialAction, updateSessionMaterialsAction, uploadSessionMaterialsAction } from '~/lib/sessions/server-actions-v2'
import useCsrfToken from '~/core/hooks/use-csrf-token'
import { getFileBuffer } from '~/lib/utils/upload-material-utils'
import { Button } from '../base-v2/ui/Button'
import useSupabase from '~/core/hooks/use-supabase'

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
  existingMaterials = []
}) => {
  console.log('existingMaterials', existingMaterials)
  const [isPending, startTransition] = useTransition()
  const csrfToken = useCsrfToken()
  
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [description, setDescription] = useState('')
  const [materialsToDelete, setMaterialsToDelete] = useState<string[]>([])

  const supabase = useSupabase();

  const handleFilesAdded = (files: File[]) => {
    const newFiles = files.map(file => ({
      id: Math.random().toString(36).slice(2),
      file,
      progress: 0,
      status: 'waiting' as const
    }))
    setUploadingFiles(prev => [...prev, ...newFiles])
  }

  const handleRemoveFile = (fileId: string) => {
    setUploadingFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const uploadFileToSupabase = async (file: File, sessionId: string) => {
    const fileExt = file.name.split('.').pop();
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `materials/${sessionId}/${uniqueFileName}`;

    const { data, error } = await supabase.storage
      .from('class-materials')
      .upload(filePath, file, { cacheControl: '3600' });

    if (error) {
      throw new Error(error.message);
    }

    const { data: publicData } = supabase.storage
      .from('class-materials')
      .getPublicUrl(filePath);

    return { publicUrl: publicData.publicUrl, filePath, uniqueFileName };
  };

  const handleUpload = async () => {
    if (uploadingFiles.length === 0) return

    try {
      // Update all files to uploading status
      setUploadingFiles(prev => 
        prev.map(f => ({ ...f, status: 'uploading' as const }))
      )

      // // Process files one by one
      // for (let i = 0; i < uploadingFiles.length; i++) {
      //   const uploadingFile = uploadingFiles[i]
      //   const file = uploadingFile.file
        
      //   try {
      //     // Convert file to buffer
      //     const buffer = await getFileBuffer(file)

      //     // Update progress
      //     setUploadingFiles(prev => 
      //       prev.map(f => f.id === uploadingFile.id 
      //         ? { ...f, progress: 50 } 
      //         : f
      //       )
      //     )

      //     // Upload to server
      //     const result = await uploadSessionMaterialsAction({
      //       sessionId,
      //       file: {
      //         name: file.name,
      //         type: file.type,
      //         size: file.size,
      //         buffer: Array.from(new Uint8Array(buffer))
      //       },
      //       description,
      //       csrfToken
      //     })

      //     if (result.success) {
      //       // Update file status to complete
      //       setUploadingFiles(prev => 
      //         prev.map(f => f.id === uploadingFile.id 
      //           ? { ...f, status: 'complete', progress: 100 } 
      //           : f
      //         )
      //       )
      //     } else {
      //       throw new Error('Upload failed')
      //     }
      //   } catch (error) {
      //     // Update file status to error
      //     setUploadingFiles(prev => 
      //       prev.map(f => f.id === uploadingFile.id 
      //         ? { ...f, status: 'error', error: 'Upload failed' } 
      //         : f
      //       )
      //     )
      //   }
      // }

      let filesToUpdateInDB = [];
      // Process files one by one
      for (const uploadingFile of uploadingFiles) {
        if (uploadingFile.status === 'complete') continue
        const { publicUrl, filePath, uniqueFileName} = await uploadFileToSupabase(uploadingFile.file, sessionId)
        // Update file status to complete
        setUploadingFiles(prev => 
          prev.map(f => f.id === uploadingFile.id 
            ? { ...f, status: 'complete', progress: 100 } 
            : f
          )
        )
        filesToUpdateInDB.push({
          session_id: sessionId,
          name: uploadingFile.file.name,
          file_size: (uploadingFile.file.size / 1024 / 1024).toFixed(2),
          url: publicUrl,
          description: description,
        })
      }
      
      const result = await updateSessionMaterialsAction({ materialData: filesToUpdateInDB })

      if (result.success) {
        setUploadingFiles([]);
      }

      // Check if all files completed successfully
      const allComplete = uploadingFiles.every(f => f.status === 'complete')
      if (allComplete) {
        // onSuccess?.()
        setShowMaterialDialog(false)
      }
    } catch (error) {
      console.error('Upload failed:', error)
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

  const isValid = uploadingFiles.length > 0

  // Determine the confirmation button text based on context
  const getConfirmButtonText = () => {
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
      onClose={() => setShowMaterialDialog(false)}
      title="Upload Class Materials"
      maxWidth="2xl"
      onConfirm={handleUpload}
      confirmButtonText={getConfirmButtonText()}
      loading={isPending}
      confirmButtonVariant={isValid ? 'default' : 'secondary'}
    >
      <div className="space-y-6">
        {/* Existing Materials */}
        {existingMaterials.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium">Existing Materials</h3>
            {existingMaterials
              .filter(material => !materialsToDelete.includes(material.id))
              .map((material) => (
                <div
                  key={material.id}
                  className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                >
                  <div className="flex items-center">
                    <span className="text-sm">{material.name}</span>
                    <span className="text-sm text-gray-600 ml-2">
                      ({material.file_size} MB)
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteMaterial(material.id, material.url || "")}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
          </div>
        )}
        <FileUploadDropzone onFilesAdded={handleFilesAdded} />

        {uploadingFiles.length > 0 && (
          <div className="space-y-3">
            {uploadingFiles.map((file) => (
              <FileUploadItem
                key={file.id}
                fileName={file.file.name}
                fileSize={(file.file.size / 1024 / 1024).toFixed(2)}
                progress={file.progress}
                status={file.status}
                error={file.error}
                onRemove={() => handleRemoveFile(file.id)}
              />
            ))}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">Description for Students</label>
          <Textarea
            placeholder="Add a description or instructions for these materials..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="h-24"
          />
        </div>
      </div>
    </BaseDialog>
  )
}

export default MaterialUploadDialog