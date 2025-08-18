'use client';

import React, { useState, useTransition } from 'react';
import { X, Plus, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '../../base-v2/ui/Alert';
import BaseDialog from '../../base-v2/BaseDialog';
import useCsrfToken from '~/core/hooks/use-csrf-token';
import { toast } from 'sonner';
import { deleteSessionAction } from '~/lib/sessions/server-actions';

interface DeleteSessionDialogProps {
  open: boolean;
  onClose: () => void;
  onDeleteSession: (classId: string) => void;
  sessionId: string;
  loading?: boolean;
}

const DeleteSessionDialog: React.FC<DeleteSessionDialogProps> = ({
  open,
  onClose,
  onDeleteSession,
  sessionId,
  loading = false,
}) => {
  const [isPending, startTransition] = useTransition();
  const csrfToken = useCsrfToken();

  const handleSubmit = () => {
    if (!sessionId) return;
    startTransition(async () => {
      const result = await deleteSessionAction({ csrfToken, sessionId });
      if (result.success) {
        onClose();
        toast.success('The session has been successfully deleted.');
      } else {
        toast.error('There was an error deleting the session. Please try again.');
      }
      onDeleteSession(sessionId);
    });
  };

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title="Delete Session"
      description="Delete this session of the class"
      maxWidth="xl"
      onConfirm={handleSubmit}
      confirmButtonText="Confirm and Delete Session"
      loading={loading}
      confirmButtonVariant={true ? 'default' : 'secondary'}
    >
      <div className="space-y-4">
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-700">
            Once you delete this session of the class, it cannot be undone. Are
            you sure you want to proceed?
          </AlertDescription>
        </Alert>
      </div>
    </BaseDialog>
  );
};

export default DeleteSessionDialog;
