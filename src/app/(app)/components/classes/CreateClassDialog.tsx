'use client';

import React, { useState, useTransition } from 'react';
import { Input } from "../base-v2/ui/Input";
import { Textarea } from "../base-v2/ui/Textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../base-v2/ui/Select";
import { X, Plus } from 'lucide-react';
import BaseDialog from '../base-v2/BaseDialog';
import { NewClassData, TimeSlot } from '~/lib/classes/types/class-v2';
import { Button } from '../base-v2/ui/Button';
import { DAYS_OF_WEEK, GRADES, SUBJECTS } from '~/lib/constants-v2';
import useCsrfToken from '~/core/hooks/use-csrf-token';
import { createClassAction } from '~/lib/classes/server-actions-v2';

interface CreateClassDialogProps {
  open: boolean;
  onClose: () => void;
  onCreateClass: (classData: NewClassData) => void;
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
  const [isPending, startTransition] = useTransition()
  const csrfToken = useCsrfToken();
  const [createClassLoading, setCreateClassLoading] = useState(false);
  
  const [newClass, setNewClass] = useState<NewClassData>({
    name: '',
    subject: '',
    description: '',
    yearGrade: '',
    monthlyFee: '',
    startDate: '',
    timeSlots: [{ day: '', time: '' }],
    tutorId,
  });

  const handleAddTimeSlot = () => {
    setNewClass(prev => ({
      ...prev,
      timeSlots: [...prev.timeSlots, { day: '', time: '' }]
    }));
  };

  const handleRemoveTimeSlot = (index: number) => {
    setNewClass(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.filter((_, i) => i !== index)
    }));
  };

  const updateTimeSlot = (index: number, field: keyof TimeSlot, value: string) => {
    setNewClass(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.map((slot, i) => 
        i === index ? { ...slot, [field]: value } : slot
      )
    }));
  };

  const handleSubmit = () => {
    setCreateClassLoading(true);
    startTransition(async () => {
      const result = await createClassAction({classData: newClass, csrfToken})
      if (result.success) {
        onClose()
        // Show success toast/notification
      } else {
        // Show error toast/notification
      }
    })
    onCreateClass(newClass);
    setCreateClassLoading(false);
  };

  const isValid =
    newClass.name &&
    newClass.subject &&
    newClass.monthlyFee &&
    newClass.yearGrade &&
    newClass.startDate &&
    newClass.timeSlots.every((slot) => slot.day && slot.time);

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title="Create Your First Class"
      description="Set up your class details and schedule"
      maxWidth="xl"
      onConfirm={handleSubmit}
      confirmButtonText="Create Class"
      loading={createClassLoading}
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
          />
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

          <div className="space-y-2">
            {newClass.timeSlots.map((slot, index) => (
              <div key={index} className="flex gap-2 items-start">
                <Select
                  value={slot.day}
                  onValueChange={(value) => updateTimeSlot(index, 'day', value)}
                >
                  <SelectTrigger className="w-[140px]">
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

                <Input
                  type="time"
                  value={slot.time}
                  onChange={(e) => updateTimeSlot(index, 'time', e.target.value)}
                  className="flex-1"
                />

                {newClass.timeSlots.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveTimeSlot(index)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </BaseDialog>
  );
};

export default CreateClassDialog;