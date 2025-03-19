'use client';

import React, { useState, useTransition } from 'react';
import { Input } from "../base-v2/ui/Input";
import { Textarea } from "../base-v2/ui/Textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../base-v2/ui/Select";
import { DAYS_OF_WEEK, GRADES, SUBJECTS } from '~/lib/constants-v2';
import useCsrfToken from '~/core/hooks/use-csrf-token';
import { createClassAction } from '~/lib/classes/server-actions-v2';
import { useToast } from '../../lib/hooks/use-toast';
import BaseDialog from '../base-v2/BaseDialog';
import { NewClassData, TimeSlot } from '~/lib/classes/types/class-v2';

interface CreateClassDialogProps {
  open: boolean;
  onClose: () => void;
  onCreateClass?: (classData: NewClassData) => void;
  loading?: boolean;
  tutorId: string;
}

const CreateClassDialog: React.FC<CreateClassDialogProps> = ({
  open,
  onClose,
  onCreateClass,
  loading = false,
  tutorId,
}) => {
  const [isPending, startTransition] = useTransition();
  const csrfToken = useCsrfToken();
  const { toast } = useToast();

  const [newClass, setNewClass] = useState<NewClassData>({
    name: '',
    subject: '',
    description: '',
    yearGrade: '',
    monthlyFee: '',
    startDate: '',
    timeSlot: { day: '', startTime: '', endTime: '' }, // Single time slot
    tutorId,
  });

  const updateTimeSlot = (field: keyof TimeSlot, value: string) => {
    setNewClass(prev => ({
      ...prev,
      timeSlot: { ...prev.timeSlot, [field]: value }, // Update the single time slot
    }));
  };

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await createClassAction({ classData: newClass, csrfToken });
      if (result.success) {
        onClose();
        toast({
          title: "Success",
          description: "New class created successfully",
          variant: "success",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to create class",
          variant: "destructive",
        });
      }
    });
    onCreateClass?.(newClass);
  };

  const isValid =
    newClass.name &&
    newClass.subject &&
    newClass.monthlyFee &&
    newClass.yearGrade &&
    newClass.startDate &&
    newClass.timeSlot.day && // Validate the single time slot
    newClass.timeSlot.startTime &&
    newClass.timeSlot.endTime;

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title="Create Class Group"
      description="Set up your class details and schedule"
      maxWidth="xl"
      onConfirm={handleSubmit}
      confirmButtonText="Create Class"
      loading={isPending}
      confirmButtonVariant={isValid ? 'default' : 'secondary'}
    >
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Class Name</label>
          <Input
            placeholder="Enter class name"
            value={newClass.name}
            onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Subject</label>
          <Select
            value={newClass.subject}
            onValueChange={(value) => setNewClass({ ...newClass, subject: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select subject" />
            </SelectTrigger>
            <SelectContent>
              {SUBJECTS.map(subject => (
                <SelectItem key={subject} value={subject.toLowerCase()}>
                  {subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">Description</label>
          <Textarea
            placeholder="Describe what students will learn in this class..."
            value={newClass.description}
            onChange={(e) => setNewClass({ ...newClass, description: e.target.value })}
            className="h-24"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Year/Grade</label>
            <Select
              value={newClass.yearGrade}
              onValueChange={(value) => setNewClass({ ...newClass, yearGrade: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {GRADES.map(year => (
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
              value={newClass.monthlyFee}
              onChange={(e) => setNewClass({ ...newClass, monthlyFee: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Starting Date</label>
          <Input
            type="date"
            value={newClass.startDate}
            onChange={(e) => setNewClass({ ...newClass, startDate: e.target.value })}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div>
          <div className="space-y-2 flex flex-col">
            <div className="flex self-end gap-[75px] mr-14">
              <label className="text-sm font-medium">Start Time</label>
              <label className="text-sm font-medium">End Time</label>
            </div>
            <div className="flex gap-2 items-start">
              <Select
                value={newClass.timeSlot.day}
                onValueChange={(value) => updateTimeSlot('day', value)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map(day => (
                    <SelectItem key={day} value={day.toLowerCase()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Input
                  type="time"
                  value={newClass.timeSlot.startTime}
                  onChange={(e) => updateTimeSlot('startTime', e.target.value)}
                  placeholder="Start time"
                />

                <Input
                  type="time"
                  value={newClass.timeSlot.endTime}
                  onChange={(e) => updateTimeSlot('endTime', e.target.value)}
                  placeholder="End time"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </BaseDialog>
  );
};

export default CreateClassDialog;