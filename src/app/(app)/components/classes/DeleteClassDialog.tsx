'use client';

import React, { useTransition } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '../base-v2/ui/Alert';
import BaseDialog from '../base-v2/BaseDialog';
import { ClassListData } from '~/lib/classes/types/class-v2';
import useCsrfToken from '~/core/hooks/use-csrf-token';
import { useToast } from '../../lib/hooks/use-toast';
import { deleteClassAction } from '~/lib/classes/server-actions-v2';

interface DeleteClassDialogProps {
  open: boolean;
  onClose: () => void;
  onDeleteClass: (classId: string) => void;
  classId: string;
  loading?: boolean;
}

const DeleteClassDialog: React.FC<DeleteClassDialogProps> = ({
  open,
  onClose,
  onDeleteClass,
  classId,
  loading = false,
}) => {
  const [isPending, startTransition] = useTransition();
  const csrfToken = useCsrfToken();
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!classId) return;
    startTransition(async () => {
      const result = await deleteClassAction({
        classId: classId,
        csrfToken,
      });
      if (result.success) {
        onClose();
        toast({
          title: 'Class Deleted',
          description: 'The class has been successfully deleted.',
          variant: 'success',
        });
      } else {
        toast({
          title: 'Error deleting class',
          description:
            'There was an error deleting the class. Please try again.',
          variant: 'destructive',
        });
      }
      onDeleteClass(classId);
    });
  };

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title="Delete Class"
      description="Delete all upcoming sessions of this class"
      maxWidth="xl"
      onConfirm={handleSubmit}
      confirmButtonText="Confirm and Delete class"
      loading={loading}
      confirmButtonVariant={true ? 'default' : 'secondary'}
    >
      <div className="space-y-4">
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-700">
            Once you delete this class, all associated data to upcoming sessions
            will be permanently removed. This action cannot be undone.
          </AlertDescription>
        </Alert>
      </div>
    </BaseDialog>
  );
};

export default DeleteClassDialog;
