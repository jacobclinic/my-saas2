'use client'

import React from 'react';
import type { MaterialUploadDialogProps } from '~/lib/sessions/types/upcoming-sessions';
import { Upload, File, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "../base-v2/ui/Card";
import { Button } from "../base-v2/ui/Button";
import { Textarea } from "../base-v2/ui/Textarea";
import BaseDialog from '../base-v2/BaseDialog';

const MaterialUploadDialog: React.FC<MaterialUploadDialogProps> = ({ 
  showMaterialDialog,
  setShowMaterialDialog,
  uploadedMaterials,
  setUploadedMaterials,
  materialDescription,
  setMaterialDescription,
}) => {
  const handleUpload = () => {
    // Handle materials upload
    console.log('Uploading materials:', uploadedMaterials);
    console.log('Description:', materialDescription);
    setShowMaterialDialog(false);
    setUploadedMaterials([]);
    setMaterialDescription('');
  };

  const handleClose = () => {
    setShowMaterialDialog(false);
    setUploadedMaterials([]);
    setMaterialDescription('');
  };

  return (
    <BaseDialog
      open={showMaterialDialog}
      onClose={handleClose}
      title="Upload Class Materials"
      maxWidth="2xl"
      onConfirm={handleUpload}
      confirmButtonText={
        <>
          <Upload className="h-4 w-4 mr-2" />
          Upload Materials
        </>
      }
    >
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Materials</h3>
            <input
              type="file"
              id="material-upload"
              className="hidden"
              multiple
              onChange={(e) => {
                const files = e.target.files;
                if (!files) return;
           
                const newFiles = Array.from(files).map(file => ({
                  id: Math.random().toString(36).substr(2, 9),
                  name: file.name,
                  size: (file.size / 1024 / 1024).toFixed(2),
                  type: file.type,
                  file: file
                }));
                setUploadedMaterials([...uploadedMaterials, ...newFiles]);
              }}
            />
            <Button 
              variant="outline"
              onClick={() => document.getElementById('material-upload')?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Add Files
            </Button>
          </div>

          {uploadedMaterials.length > 0 ? (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {uploadedMaterials.map((material) => (
                    <div key={material.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <File className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="font-medium">{material.name}</p>
                          <p className="text-sm text-gray-600">{material.size} MB</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => setUploadedMaterials(
                          uploadedMaterials.filter(m => m.id !== material.id)
                        )}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex items-center justify-center h-32 border-2 border-dashed border-gray-200 rounded-lg">
              <div className="text-center">
                <Upload className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">Upload class materials</p>
                <p className="text-xs text-gray-500">PDF, DOC, PPT, or images</p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Description for Students</label>
          <Textarea
            placeholder="Add a description or instructions for these materials..."
            value={materialDescription}
            onChange={(e) => setMaterialDescription(e.target.value)}
            className="h-24"
          />
        </div>
      </div>
    </BaseDialog>
  );
};

export default MaterialUploadDialog;