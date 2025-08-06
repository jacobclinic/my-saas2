'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { Input } from '../base-v2/ui/Input';
import { Textarea } from '../base-v2/ui/Textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../base-v2/ui/Select';
import { X, Plus, AlertTriangle, Delete, Trash } from 'lucide-react';
import { Alert, AlertDescription } from '../base-v2/ui/Alert';
import BaseDialog from '../base-v2/BaseDialog';
import {
  TimeSlot,
  EditClassData,
  ClassListData,
  ClassType,
  UpdateClassData,
} from '~/lib/classes/types/class-v2';
import { Button } from '../base-v2/ui/Button';
import { DAYS_OF_WEEK, GRADES, SUBJECTS } from '~/lib/constants-v2';
import useCsrfToken from '~/core/hooks/use-csrf-token';
import { updateClassAction } from '~/lib/classes/server-actions-v2';
import { useToast } from '../../lib/hooks/use-toast';
import DeleteClassDialog from './DeleteClassDialog';
import { Json } from '~/database.types';

interface EditClassDialogProps {
  open: boolean;
  onClose: () => void;
  onUpdateClass: (classId: string, classData: EditClassData) => void;
  classData: ClassListData;
  loading?: boolean;
}

const EditClassDialog: React.FC<EditClassDialogProps> = ({
  open,
  onClose,
  onUpdateClass,
  classData,
  loading = false,
}) => {
  const [isPending, startTransition] = useTransition();
  const csrfToken = useCsrfToken();
  const { toast } = useToast();

  // Add a state to store the original class data for comparison
  const [originalClass, setOriginalClass] = useState<EditClassData | null>(
    null,
  );

  const [editedClass, setEditedClass] = useState<EditClassData>({
    name: '',
    subject: '',
    description: '',
    yearGrade: '',
    monthlyFee: 0,
    startDate: '',
    timeSlots: [{ day: '', startTime: '', endTime: '' }],
    status: 'active',
  });

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteClassLoading, setDeleteClassLoading] = useState(false);

  // Extract the minimum time slots condition for reusability
  const hasMinimumTimeSlots = editedClass.timeSlots.length <= 1;

  const handleDeleteClass = async (classId: string) => {
    try {
      setDeleteClassLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Error adding student:', error);
    } finally {
      setDeleteClassLoading(false);
    }
  };

  useEffect(() => {
    if (classData) {
      const addMinutes = (time: any, minutesToAdd: any) => {
        // Split the time into hours and minutes
        let [hours, minutes] = time.split(':').map(Number);
        // Convert to total minutes and add the extra minutes
        let totalMinutes = hours * 60 + minutes + minutesToAdd;
        // Wrap around if total minutes exceed 24 hours (1440 minutes)
        totalMinutes %= 1440;
        // Convert back to hours and minutes
        const newHours = Math.floor(totalMinutes / 60);
        const newMinutes = totalMinutes % 60;
        // Format to "HH:mm"
        return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
      };

      // Transform the incoming time slots format to include startTime and endTime
      const transformedTimeSlots = classData?.classRawData?.time_slots?.map(
        (slot: any) => {
          // Handle both old format (time) and new format (startTime, endTime)
          return {
            day: slot.day || '',
            startTime: slot.startTime || slot.time || '', // Support old format
            endTime:
              slot.endTime || slot.startTime
                ? addMinutes(slot.startTime, 120)
                : '', // Will be empty for old format data
          };
        },
      ) || [{ day: '', startTime: '', endTime: '' }];

      const initialData = {
        name: classData?.classRawData?.name || '',
        subject: classData?.classRawData?.subject || '',
        description: classData?.classRawData?.description || '',
        yearGrade: classData?.classRawData?.grade || '',
        monthlyFee: classData?.classRawData?.fee || 0,
        startDate: classData?.classRawData?.starting_date || '',
        timeSlots: classData?.classRawData?.time_slots || [
          { day: '', startTime: '', endTime: '' },
        ],
        status:
          (classData?.classRawData?.status as 'active' | 'canceled') ||
          'active',
      };

      setEditedClass(initialData);
      // Store the original data for comparison
      setOriginalClass(JSON.parse(JSON.stringify(initialData)));
    }
  }, [classData]);

  const handleAddTimeSlot = () => {
    setEditedClass((prev) => ({
      ...prev,
      timeSlots: [...prev.timeSlots, { day: '', startTime: '', endTime: '' }],
    }));
  };

  const handleRemoveTimeSlot = (index: number) => {
    // Ensure at least one time slot remains
    if (hasMinimumTimeSlots) {
      return;
    }

    setEditedClass((prev) => ({
      ...prev,
      timeSlots: prev.timeSlots.filter((_, i) => i !== index),
    }));
  };

  const updateTimeSlot = (
    index: number,
    field: keyof TimeSlot,
    value: string,
  ) => {
    setEditedClass((prev) => ({
      ...prev,
      timeSlots: prev.timeSlots.map((slot, i) =>
        i === index ? { ...slot, [field]: value } : slot,
      ),
    }));
  };

  // console.log("-------editedClass--------", editedClass)

  const handleSubmit = () => {
    if (classData) {
      startTransition(async () => {
        const updateClassPayload: UpdateClassData = {
          name: editedClass.name,
          subject: editedClass.subject,
          description: editedClass.description,
          grade: editedClass.yearGrade,
          fee: editedClass.monthlyFee,
          starting_date: editedClass.startDate,
          time_slots: editedClass.timeSlots as unknown as Json[],
          status: editedClass.status,
        }
        const result = await updateClassAction({
          classId: classData.id,
          classData: updateClassPayload,
          csrfToken,
        });
        if (result.success) {
          onClose();
          toast({
            title: 'Success',
            description: 'Class edited successfully',
            variant: 'success',
          });
        } else {
          const errorMessage = result.error || 'Failed to edit class, Please try again. If the problem persists, please contact support.';
          toast({
            title: 'Error',
            description: errorMessage,
            variant: 'destructive',
          });
        }
      });
      onUpdateClass(classData.id, editedClass);
    }
  };

  const isValid =
    editedClass.name &&
    editedClass.subject &&
    editedClass.monthlyFee &&
    editedClass.yearGrade &&
    editedClass.startDate &&
    editedClass.timeSlots.every(
      (slot) => slot.day && slot.startTime && slot.endTime,
    );

  const statuses = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'draft', label: 'Draft' },
  ];

  const formatToDateInput = (isoString: string): string => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toISOString().split('T')[0]; // Extract the YYYY-MM-DD part
  };

  // Function to check if any changes were made to the class data
  const hasChanges = (): boolean => {
    if (!originalClass) return false;

    // Check primitive fields
    if (
      editedClass.name !== originalClass.name ||
      editedClass.subject !== originalClass.subject ||
      editedClass.description !== originalClass.description ||
      editedClass.yearGrade !== originalClass.yearGrade ||
      editedClass.monthlyFee !== originalClass.monthlyFee ||
      editedClass.startDate !== originalClass.startDate ||
      editedClass.status !== originalClass.status
    ) {
      return true;
    }

    // Check time slots
    if (editedClass.timeSlots.length !== originalClass.timeSlots.length) {
      return true;
    }

    // Check each time slot
    for (let i = 0; i < editedClass.timeSlots.length; i++) {
      const editedSlot = editedClass.timeSlots[i];
      const originalSlot = originalClass.timeSlots[i];

      if (
        editedSlot.day !== originalSlot.day ||
        editedSlot.startTime !== originalSlot.startTime ||
        editedSlot.endTime !== originalSlot.endTime
      ) {
        return true;
      }
    }

    return false;
  };

  const handleClose = () => {
    onClose();
    // Reset edited class to original data
    if (originalClass) {
      setEditedClass(JSON.parse(JSON.stringify(originalClass)));
    } else {
      setEditedClass({
        name: classData?.classRawData?.name || '',
        subject: classData?.classRawData?.subject || '',
        description: classData?.classRawData?.description || '',
        yearGrade: classData?.classRawData?.grade || '',
        monthlyFee: classData?.classRawData?.fee || 0,
        startDate: classData?.classRawData?.starting_date || '',
        timeSlots: classData?.classRawData?.time_slots || [
          { day: '', startTime: '', endTime: '' },
        ],
        status:
          (classData?.classRawData?.status as 'active' | 'canceled') ||
          'active',
      });
    }
  };

  return (
    <>
      <BaseDialog
        open={open}
        onClose={handleClose}
        title="Edit Class"
        description="Update your class details and schedule"
        maxWidth="xl"
        onConfirm={handleSubmit}
        confirmButtonText="Save Changes"
        loading={loading}
        confirmButtonVariant={isValid ? 'default' : 'secondary'}
        deleteClassOption={true}
        deleteClassText={
          classData!.status === 'active'
            ? 'Cancel upcoming classes'
            : 'Already canceled class'
        }
        onDeleteClass={() => {
          setShowDeleteDialog(true);
          onClose();
        }}
        deleteClassBtnDisabled={classData!.status !== 'active'}
        confirmButtonDisabled={!isValid || !hasChanges() || loading}
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Class Name</label>
            <Input
              placeholder="Enter class name"
              value={editedClass.name}
              onChange={(e) =>
                setEditedClass({ ...editedClass, name: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Subject</label>
              <Select
                value={editedClass.subject}
                onValueChange={(value) =>
                  setEditedClass({ ...editedClass, subject: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((subject) => (
                    <SelectItem key={subject} value={subject.toLowerCase()}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea
              placeholder="Describe what students will learn in this class..."
              value={editedClass.description}
              onChange={(e) =>
                setEditedClass({ ...editedClass, description: e.target.value })
              }
              className="h-24"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Year/Grade</label>
              <Select
                value={editedClass.yearGrade}
                onValueChange={(value) =>
                  setEditedClass({ ...editedClass, yearGrade: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {GRADES.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Monthly Fee (Rs.)</label>
              <Input
                type="number"
                placeholder="Enter fee amount"
                value={editedClass.monthlyFee}
                onChange={(e) =>
                  setEditedClass({
                    ...editedClass,
                    monthlyFee: parseInt(e.target.value),
                  })
                }
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium">Class Schedule</label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTimeSlot}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Time Slot
              </Button>
            </div>

            <div className="space-y-2 flex flex-col pb-2">
              <div className="flex self-end gap-[75px] mr-14">
                <label className="text-sm font-medium">Start Time</label>
                <label className="text-sm font-medium">End Time</label>
              </div>
              {editedClass?.timeSlots?.map((slot, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <Select
                    value={slot.day}
                    onValueChange={(value) =>
                      updateTimeSlot(index, 'day', value)
                    }
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_OF_WEEK.map((day) => (
                        <SelectItem key={day} value={day.toLowerCase()}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex gap-2">
                    <Input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) =>
                        updateTimeSlot(index, 'startTime', e.target.value)
                      }
                      placeholder="Start time"
                    />

                    <Input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) =>
                        updateTimeSlot(index, 'endTime', e.target.value)
                      }
                      placeholder="End time"
                    />
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveTimeSlot(index)}
                    className={`${
                      hasMinimumTimeSlots
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-red-500 hover:text-red-600'
                    }`}
                    disabled={hasMinimumTimeSlots}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-700">
              Changes to the class schedule will affect all enrolled students.
              Make sure to notify them of any changes.
            </AlertDescription>
          </Alert>
        </div>
      </BaseDialog>
      <DeleteClassDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onDeleteClass={handleDeleteClass}
        classId={classData!.id}
        loading={deleteClassLoading}
      />
    </>
  );
};

export default EditClassDialog;
