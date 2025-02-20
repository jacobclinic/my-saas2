'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { Input } from "../base-v2/ui/Input";
import { Textarea } from "../base-v2/ui/Textarea";
import { AlertTriangle, X, Upload, File, Plus, Trash } from 'lucide-react';
import { Alert, AlertDescription } from "../base-v2/ui/Alert";
import BaseDialog from '../base-v2/BaseDialog';
import useCsrfToken from '~/core/hooks/use-csrf-token';
import { Button } from '../base-v2/ui/Button';
// import { updateSessionAction } from '~/lib/sessions/server-actions-v2';

interface Material {
  id: string;
  name: string | null;
  url?: string | null;
  file_size: string | null;
}

interface EditSessionData {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  materials: Material[];
  meetingUrl?: string;
}

interface EditSessionDialogProps {
  open: boolean;
  onClose: () => void;
  sessionId: string;
  sessionData: EditSessionData;
  loading?: boolean;
}

const EditSessionDialog: React.FC<EditSessionDialogProps> = ({
  open,
  onClose,
  sessionId,
  sessionData,
  loading = false
}) => {
  const [isPending, startTransition] = useTransition()
  const csrfToken = useCsrfToken();

  const [editedSession, setEditedSession] = useState<EditSessionData>({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    materials: [],
    meetingUrl: ''
  });

  const [uploadedMaterials, setUploadedMaterials] = useState<{
    id: string;
    name: string;
    size: string;
    file: File;
  }[]>([]);

  // State to track materials marked for deletion
  const [materialsToDelete, setMaterialsToDelete] = useState<string[]>([]);

  useEffect(() => {
    if (sessionData) {
      setEditedSession({
        title: sessionData.title || '',
        description: sessionData.description || '',
        startTime: sessionData.startTime || '',
        endTime: sessionData.endTime || '',
        materials: sessionData.materials || [],
        meetingUrl: sessionData.meetingUrl || ''
      });
    }
    console.log("sessionData-----------1---------", sessionData);
  }, [sessionData]);

  const handleSubmit = () => {
    if (sessionId) {
    //   startTransition(async () => {
    //     // Here you would typically:
    //     // 1. Upload any new materials first
    //     // 2. Delete any materials marked for deletion
    //     // 3. Update the session details
    //     const result = await updateSessionAction({
    //       sessionId,
    //       sessionData: editedSession,
    //       newMaterials: uploadedMaterials,
    //       deleteMaterials: materialsToDelete,
    //       csrfToken
    //     });
        
    //     if (result.success) {
    //       onClose();
    //       // Show success toast/notification
    //     } else {
    //       // Show error toast/notification
    //     }
    //   });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2), // Convert to MB
      file: file
    }));
    setUploadedMaterials([...uploadedMaterials, ...newFiles]);
  };

  const handleRemoveUploadedMaterial = (id: string) => {
    setUploadedMaterials(prevMaterials => 
      prevMaterials.filter(material => material.id !== id)
    );
  };

  const handleDeleteExistingMaterial = (materialId: string) => {
    setMaterialsToDelete([...materialsToDelete, materialId]);
  };

  const isValid =
    editedSession.startTime &&
    editedSession.endTime;

  const formatToDateTimeInput = (isoString: string): string => {
    if (!isoString) return '';
    
    // Create a date object from the ISO string
    // This will automatically convert to local timezone
    const date = new Date(isoString);
    
    // Get local ISO string
    const localISOString = new Date(
      date.getTime() - (date.getTimezoneOffset() * 60000)
    ).toISOString();
    
    // Return the formatted string for datetime-local input
    return localISOString.slice(0, 16);
  };

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title="Edit Session"
      description="Update your session details"
      maxWidth="xl"
      onConfirm={handleSubmit}
      confirmButtonText="Save Changes"
      loading={loading}
      confirmButtonVariant={isValid ? 'default' : 'secondary'}
    >
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Session Title</label>
          <Input 
            placeholder="Enter session title"
            value={editedSession.title}
            onChange={(e) => setEditedSession({ ...editedSession, title: e.target.value })}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Description</label>
          <Textarea 
            placeholder="Describe what will be covered in this session..."
            value={editedSession.description}
            onChange={(e) => setEditedSession({ ...editedSession, description: e.target.value })}
            className="h-24"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Start Time</label>
            <Input 
              type="datetime-local"
              value={formatToDateTimeInput(editedSession.startTime)}
              onChange={(e) => setEditedSession({ ...editedSession, startTime: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-medium">End Time</label>
            <Input 
              type="datetime-local"
              value={formatToDateTimeInput(editedSession.endTime)}
              onChange={(e) => setEditedSession({ ...editedSession, endTime: e.target.value })}
            />
          </div>
        </div>

        {/* Materials Section */}
        <div className="space-y-4">
          {/* <div className="flex justify-between items-center">
              <h3 className="font-medium">Class Materials</h3>
              <div>
              <input
                  type="file"
                  id="material-upload"
                  className="hidden"
                  multiple
                  onChange={handleFileUpload}
              />
              <Button 
                  variant="outline"
                  onClick={() => document.getElementById('material-upload')?.click()}
              >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Materials
              </Button>
              </div>
          </div> */}

          {/* Existing Materials */}
          {/* {editedSession.materials.length > 0 && (
              <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Existing Materials</h4>
              {editedSession.materials.map((material) => (
                  !materialsToDelete.includes(material.id) && (
                  <div 
                      key={material.id} 
                      className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                  >
                      <div className="flex items-center">
                      <File className="h-4 w-4 text-blue-600 mr-2" />
                      <div>
                          <p className="font-medium">{material.name}</p>
                          <p className="text-sm text-gray-600">{material.file_size}</p>
                      </div>
                      </div>
                      <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteExistingMaterial(material.id)}
                      className="text-red-500 hover:text-red-700"
                      >
                      <Trash className="h-4 w-4" />
                      </Button>
                  </div>
                  )
              ))}
              </div>
          )} */}

          {/* New Materials */}
          {/* {uploadedMaterials.length > 0 && (
              <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">New Materials</h4>
              {uploadedMaterials.map((material) => (
                  <div 
                  key={material.id} 
                  className="flex items-center justify-between bg-green-50 p-3 rounded-lg"
                  >
                  <div className="flex items-center">
                      <Upload className="h-4 w-4 text-green-600 mr-2" />
                      <div>
                      <p className="font-medium">{material.name}</p>
                      <p className="text-sm text-gray-600">{material.size} MB</p>
                      </div>
                  </div>
                  <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveUploadedMaterial(material.id)}
                      className="text-red-500 hover:text-red-700"
                  >
                      <X className="h-4 w-4" />
                  </Button>
                  </div>
              ))}
              </div>
          )} */}
        </div>

        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-700">
            Changes to the session details will affect all enrolled students. Make sure to notify them of any changes.
          </AlertDescription>
        </Alert>
      </div>
    </BaseDialog>
  );
};

export default EditSessionDialog;