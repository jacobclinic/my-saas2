'use client';

import React from 'react';
import { Input } from '../base-v2/ui/Input';
import { Textarea } from '../base-v2/ui/Textarea';
import {
  BookOpen,
  BookMarked,
  ListChecks,
} from 'lucide-react';
import BaseDialog from '../base-v2/BaseDialog';
import Label from '~/core/ui/Label';
import {
  LessonDetails,
} from '~/lib/sessions/types/upcoming-sessions';

interface Props {
  open: boolean;
  onClose: () => void;
  lessonDetails: LessonDetails;
  setLessonDetails: (arg: LessonDetails) => void;
  onConfirm: () => void;
  loading: boolean;
  originalLessonDetails?: LessonDetails;
}

const AddLessonDetailsDialog: React.FC<Props> = ({
  open,
  onClose,
  lessonDetails,
  setLessonDetails,
  onConfirm,
  loading,
  originalLessonDetails
}) => {

  // Check if there are any changes from the original state
  const hasChanges = () => {
    if (!originalLessonDetails) return true; // Allow saving if no original state
    
    return (
      lessonDetails.title !== (originalLessonDetails.title || '') ||
      lessonDetails.description !== (originalLessonDetails.description || '')
    );
  };

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={`${lessonDetails?.title ? "Edit" : "Add"} Lesson Details`}
      maxWidth="xl"
      onConfirm={onConfirm}
      confirmButtonText="Save Changes"
      confirmButtonVariant={hasChanges() ? 'default' : 'secondary'}
      confirmButtonDisabled={!hasChanges()}
      loading={loading}
    >
      <div className="">
        <div className="space-y-4 px-2 py-1">
          <div className="space-y-2">
            <Label htmlFor="topic" className="flex items-center gap-2">
              <BookOpen size={16} className="text-primary-blue-600" />
              Topic
            </Label>
            <Input
              value={lessonDetails?.title || ''}
              onChange={(e) =>
                setLessonDetails({
                  ...lessonDetails,
                  title: e.target.value,
                })
              }
              placeholder="Enter the lesson title..."
              className="w-full"
              id="topic"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-2">
              <ListChecks size={16} className="text-primary-blue-600" />
              Lesson Description
            </Label>
            <Textarea
              id="description"
              value={lessonDetails?.description || ''}
              onChange={(e) =>
                setLessonDetails({
                  ...lessonDetails,
                  description: e.target.value,
                })
              }
              placeholder="Enter the lesson description..."
              className="w-full"
              rows={4}
            />
          </div>
        </div>
      </div>
    </BaseDialog>
  );
};

export default AddLessonDetailsDialog;
