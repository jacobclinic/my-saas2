'use client';

import React, { useCallback, useEffect, useState, useTransition } from 'react';
import { Input } from '../base-v2/ui/Input';
import { Textarea } from '../base-v2/ui/Textarea';
import { Checkbox } from '../base-v2/ui/Checkbox';
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
import UserType from '~/lib/user/types/user';

interface CreateClassDialogProps {
  open: boolean;
  onClose: () => void;
  onCreateClass?: (classData: NewClassData) => void;
  loading?: boolean;
  tutorId: string;
  tutorProfile?: UserType | null;
}

const CreateClassDialog: React.FC<CreateClassDialogProps> = ({
  open,
  onClose,
  onCreateClass,
  loading = false,
  tutorId,
  tutorProfile,
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
  
  // Get the first subject from tutor's profile if available
  const getPreselectedSubject = useCallback(() => {
    if (tutorProfile?.subjects_teach && tutorProfile.subjects_teach.length > 0) {
      return tutorProfile.subjects_teach[0].toLowerCase();
    }
    return '';
  }, [tutorProfile?.subjects_teach]);

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
    allowFreeAccessFirstWeek: false,
  });

  const [allFilled, setAllFilled] = useState(false);

  // Update subject when tutor profile changes
  useEffect(() => {
    const preselectedSubject = getPreselectedSubject();
    if (preselectedSubject) {
      setNewClass(prev => ({ ...prev, subject: preselectedSubject }));
    }
  }, [getPreselectedSubject]);

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
    const classDataPayload: CreateClassPayload = {
      fee: Number(newClass.monthlyFee),
      grade: newClass.yearGrade,
      name: newClass.name,
      description: newClass.description,
      starting_date: startDate,
      status: 'active',
      subject: newClass.subject,
      time_slots: newClass.timeSlots as unknown as Json[],
      tutor_id: newClass.tutorId,
      allow_free_access_first_week: newClass.allowFreeAccessFirstWeek,
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
          subject: getPreselectedSubject(),
          description: '',
          yearGrade: '',
          monthlyFee: '',
          startDate: '',
          timeSlots: [
            { day: '', startTime: '', endTime: '', timezone: userTimezone },
          ], // Reset to a single time slot
          tutorId,
          allowFreeAccessFirstWeek: false,
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
      subject: getPreselectedSubject(),
      description: '',
      yearGrade: '',
      monthlyFee: '',
      startDate: '',
      timeSlots: [
        { day: '', startTime: '', endTime: '', timezone: userTimezone },
      ], // Reset to a single time slot
      tutorId,
      allowFreeAccessFirstWeek: false,
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
      <div className="space-y-6">
        {/* Basic Information Section */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Class Name</label>
            <Input
              placeholder="Enter class name"
              value={newClass.name}
              onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Subject</label>
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

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <Textarea
              placeholder="Describe what students will learn in this class..."
              value={newClass.description}
              onChange={(e) =>
                setNewClass({ ...newClass, description: e.target.value })
              }
              className="h-24 resize-none"
            />
          </div>
        </div>

        {/* Course Details Section */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Year/Grade</label>
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

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Monthly Fee (Rs.)</label>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Starting Date</label>
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

          {/* Allow Free Access First Week */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="allowFreeAccess"
                checked={newClass.allowFreeAccessFirstWeek}
                onCheckedChange={(checked) =>
                  setNewClass({ ...newClass, allowFreeAccessFirstWeek: checked as boolean })
                }
              />
              <label
                htmlFor="allowFreeAccess"
                className="text-sm font-medium text-gray-700 cursor-pointer"
              >
                Allow free access for the first week
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1 ml-7">
              Students can join the first week of classes without payment
            </p>
          </div>
        </div>

        {/* Class Schedule Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-gray-700">Class Schedule</h3>
              <TimezoneIndicator />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddTimeSlot}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Time Slot
            </Button>
          </div>

          <div className="space-y-3">
            {/* Column Headers - Hidden on mobile */}
            <div className="hidden sm:grid grid-cols-[200px_1fr_auto] gap-3 items-center px-1">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Day</span>
              <div className="grid grid-cols-2 gap-3">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Start Time</span>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">End Time</span>
              </div>
              {newClass.timeSlots.length > 1 && (
                <div className="w-10"></div>
              )}
            </div>

            {/* Time Slot Rows */}
            {newClass.timeSlots.map((slot, index) => (
              <div key={index}>
                {/* Desktop Layout */}
                <div className="hidden sm:grid grid-cols-[200px_1fr_auto] gap-3 items-start">
                  <Select
                    value={slot.day}
                    onValueChange={(value) => updateTimeSlot(index, 'day', value)}
                  >
                    <SelectTrigger>
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

                  <div className="grid grid-cols-2 gap-3">
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
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Mobile Layout */}
                <div className="sm:hidden space-y-3 p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Time Slot {index + 1}</span>
                    {newClass.timeSlots.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveTimeSlot(index)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Day</label>
                      <Select
                        value={slot.day}
                        onValueChange={(value) => updateTimeSlot(index, 'day', value)}
                      >
                        <SelectTrigger>
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
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Start Time</label>
                        <Input
                          type="time"
                          value={slot.startTime}
                          onChange={(e) =>
                            updateTimeSlot(index, 'startTime', e.target.value)
                          }
                          placeholder="Start time"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">End Time</label>
                        <Input
                          type="time"
                          value={slot.endTime}
                          onChange={(e) =>
                            updateTimeSlot(index, 'endTime', e.target.value)
                          }
                          placeholder="End time"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </BaseDialog>
  );
};

export default CreateClassDialog;
