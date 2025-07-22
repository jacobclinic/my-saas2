import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/Dialog';
import { Button } from './ui/Button';
import { cn } from '../../lib/utils';
import { Trash } from 'lucide-react';

export interface BaseDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showCloseButton?: boolean;
  closeButtonText?: string;
  onConfirm?: () => void;
  confirmButtonText?: string | React.ReactNode;
  confirmButtonVariant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link'
    | 'primary';
  contentClassName?: string;
  description?: React.ReactNode;
  loading?: boolean;
  headerClassName?: string;
  deleteClassOption?: boolean;
  onDeleteClass?: () => void;
  deleteClassText?: string;
  deleteClassBtnDisabled?: boolean;
  confirmButtonDisabled?: boolean;
}

const BaseDialog: React.FC<BaseDialogProps> = ({
  open,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'xl',
  showCloseButton = true,
  closeButtonText = 'Cancel',
  onConfirm,
  confirmButtonText = 'Confirm',
  confirmButtonVariant = 'default',
  contentClassName = '',
  description,
  loading = false,
  headerClassName = '',
  deleteClassOption = false,
  onDeleteClass,
  deleteClassText = 'Delete Class',
  deleteClassBtnDisabled,
  confirmButtonDisabled,
}) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          maxWidthClasses[maxWidth],
          'max-h-[90dvh] overflow-y-auto',
        )}
      >
        <DialogHeader className={headerClassName}>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <p className="text-sm text-gray-500">{description}</p>
          )}
        </DialogHeader>

        {/* Wrapping content in a scrollable div */}
        <div className={cn('overflow-y-auto', contentClassName)}>
          {children}
        </div>

        <DialogFooter>
          {footer || (
            <>
              {showCloseButton && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={loading}
                >
                  {closeButtonText}
                </Button>
              )}
              {deleteClassOption && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onDeleteClass}
                  disabled={deleteClassBtnDisabled}
                  className="bg-red-500 text-white hover:bg-red-600"
                >
                  <Trash className="h-4 w-4 mr-2" />
                  {deleteClassText}
                </Button>
              )}
              {onConfirm && (
                <Button
                  type="button"
                  onClick={onConfirm}
                  variant={confirmButtonVariant}
                  disabled={loading || confirmButtonDisabled}
                >
                  {confirmButtonText}
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BaseDialog;
