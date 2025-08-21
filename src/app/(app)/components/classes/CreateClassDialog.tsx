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
import TimezoneIndicator from '../TimezoneIndicator';
import { DAYS_OF_WEEK, GRADES, SUBJECTS } from '~/lib/constants-v2';
import useCsrfToken from '~/core/hooks/use-csrf-token';
import { createClassAction } from '~/lib/classes/server-actions-v2';
import { toast } from 'sonner';
import BaseDialog from '../base-v2/BaseDialog';
import { CreateClassPayload, NewClassData, TimeSlot } from '~/lib/classes/types/class-v2';
import Button from '~/core/ui/Button';
import { Plus, X } from 'lucide-react';
import { Json } from '~/database.types';

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

  // Get today's date in Sri Lanka timezone (UTC+5:30) in YYYY-MM-DD format
  const getTodayInSriLankaTimezone = () => {
    const now = new Date();
    const currentTime = now.getTime();
    const sriLankaTime = currentTime + 5.5 * 60 * 60 * 1000;
    const sriLankaDate = new Date(sriLankaTime);

    const year = sriLankaDate.getUTCFullYear();
    const month = String(sriLankaDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(sriLankaDate.getUTCDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  const today = getTodayInSriLankaTimezone();
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [newClass, setNewClass] = useState<NewClassData>({
    name: '',
    subject: '',
    description: '',
    yearGrade: '',
    monthlyFee: '',
    startDate: today, // Default to today's date in local timezone
    timeSlots: [
      { day: '', startTime: '', endTime: '', timezone: userTimezone },
    ], // Single time slot
    tutorId,
  });

  const [allFilled, setAllFilled] = useState(false);

  const handleAddTimeSlot = () => {
    setNewClass((prev) => ({
      ...prev,
      timeSlots: [...prev.timeSlots, { day: '', startTime: '', endTime: '', timezone: userTimezone }],
    }));
  };

  const handleRemoveTimeSlot = (index: number) => {
    setNewClass((prev) => ({
      ...prev,
      timeSlots: prev.timeSlots.filter((_, i) => i !== index),
    }));
  };

  const updateTimeSlot = (
    index: number,
    field: keyof TimeSlot,
    value: string,
  ) => {
    setNewClass((prev: NewClassData) => {
      const updatedTimeSlots = prev.timeSlots.map((slot, i) =>
        i === index ? { ...slot, [field]: value } : slot,
      );

      return {
        ...prev,
        timeSlots: updatedTimeSlots as [TimeSlot], // Type assertion to match the expected tuple type
      };
    });
  };

  const handleSubmit = () => {
    const startDate = new Date(newClass.startDate).toISOString();
    const classDataPayload: CreateClassPayload ={
      fee: Number(newClass.monthlyFee),
      grade: newClass.yearGrade,
      name: newClass.name,
      description: newClass.description,
      starting_date: startDate,
      status: 'active',
      subject: newClass.subject,
      time_slots: newClass.timeSlots as unknown as Json[],
      tutor_id: newClass.tutorId
    }

    startTransition(async () => {
      const result = await createClassAction({
        data: classDataPayload,
        csrfToken,
      });

      if (result.success) {
        onClose();
        toast.success('New class created successfully');
        setNewClass({
          name: '',
          subject: '',
          description: '',
          yearGrade: '',
          monthlyFee: '',
          startDate: '',
          timeSlots: [
            { day: '', startTime: '', endTime: '', timezone: userTimezone },
          ], // Reset to a single time slot
          tutorId,
        });
      } else {
        const errorMessage = result.error || 'Failed to create class, Please try again. If the problem persists, please contact support.';
        toast.error(errorMessage);
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
    newClass.timeSlots.every(
      (slot) => slot.day && slot.startTime && slot.endTime,
    );

  useEffect(() => {
    if (isValid) {
      setAllFilled(true);
    } else {
      setAllFilled(false);
    }
  }, [
    newClass.name,
    newClass.subject,
    newClass.monthlyFee,
    newClass.yearGrade,
    newClass.startDate,
    newClass.timeSlots,
    isValid,
  ]);


  const handleClose = () => {
    onClose();
    setNewClass({
      name: '',
      subject: '',
      description: '',
      yearGrade: '',
      monthlyFee: '',
      startDate: '',
      timeSlots: [
        { day: '', startTime: '', endTime: '', timezone: userTimezone },
      ], // Reset to a single time slot
      tutorId,
    });
  };

  return (
    <BaseDialog
      open={open}
      onClose={handleClose}
      title="Create Class Group"
      description="Set up your class details and schedule"
      maxWidth="xl"
      onConfirm={handleSubmit}
      confirmButtonText="Create Class"
      loading={isPending}
      confirmButtonVariant={isValid ? 'primary' : 'secondary'}
      confirmButtonDisabled={!allFilled}
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
            onValueChange={(value) =>
              setNewClass({ ...newClass, subject: value })
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

        <div>
          <label className="text-sm font-medium">Description</label>
          <Textarea
            placeholder="Describe what students will learn in this class..."
            value={newClass.description}
            onChange={(e) =>
              setNewClass({ ...newClass, description: e.target.value })
            }
            className="h-24"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Year/Grade</label>
            <Select
              value={newClass.yearGrade}
              onValueChange={(value) =>
                setNewClass({ ...newClass, yearGrade: value })
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
              value={newClass.monthlyFee}
              onChange={(e) =>
                setNewClass({ ...newClass, monthlyFee: e.target.value })
              }
            />
          </div>
        </div>

        <div className="flex justify-between gap-4">
          <div>
            <label className="text-sm font-medium">Starting Date</label>
            <Input
              type="date"
              value={newClass.startDate}
              onChange={(e) =>
                setNewClass({ ...newClass, startDate: e.target.value })
              }
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        {/* Class Schedule with Timezone Indicator */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <TimezoneIndicator />
          </div>
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
            {newClass.timeSlots.map((slot, index) => (
              <div key={index} className="flex gap-2 items-start">
                <Select
                  value={slot.day}
                  onValueChange={(value) => updateTimeSlot(index, 'day', value)}
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
