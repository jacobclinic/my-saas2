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
import { TimeInput, DatePicker, Select as HeroSelect, SelectItem as HeroSelectItem, Input as HeroInput, Textarea as HeroTextarea } from '@heroui/react';
import { Time, CalendarDate, getLocalTimeZone, parseDate } from '@internationalized/date';
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

  // Utility functions to convert between time strings and Time objects
  const timeStringToTime = (timeString: string): Time | null => {
    if (!timeString) return null;
    const [hours, minutes] = timeString.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return null;
    return new Time(hours, minutes);
  };

  const timeToTimeString = (time: Time | null): string => {
    if (!time) return '';
    return `${time.hour.toString().padStart(2, '0')}:${time.minute.toString().padStart(2, '0')}`;
  };

  // Utility functions to convert between date strings and CalendarDate objects
  const dateStringToCalendarDate = (dateString: string): CalendarDate | null => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null;
      return new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
    } catch {
      return null;
    }
  };

  const calendarDateToDateString = (date: CalendarDate | null): string => {
    if (!date) return '';
    const year = date.year;
    const month = String(date.month).padStart(2, '0');
    const day = String(date.day).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

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

  const updateTimeSlotWithTime = (
    index: number,
    field: 'startTime' | 'endTime',
    time: Time | null,
  ) => {
    const timeString = timeToTimeString(time);
    updateTimeSlot(index, field, timeString);
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
            <HeroInput
              placeholder="Enter class name"
              value={newClass.name}
              onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
              classNames={{
                base: "w-full",
                input: "text-sm",
                inputWrapper: "bg-gray-50 border border-gray-300 hover:border-gray-400 rounded-md"
              }}
              radius="sm"
              size="md"
              variant="bordered"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Subject</label>
            <HeroSelect
              selectedKeys={newClass.subject ? [newClass.subject] : []}
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0] as string;
                setNewClass({ ...newClass, subject: selectedKey });
              }}
              classNames={{
                base: "w-full",
                trigger: "bg-gray-50 border border-gray-300 hover:border-gray-400 rounded-md",
                value: "text-sm pr-8",
                selectorIcon: "right-2"
              }}
              radius="sm"
              size="md"
              variant="bordered"
            >
              {SUBJECTS.map((subject) => (
                <HeroSelectItem key={subject.toLowerCase()} value={subject.toLowerCase()}>
                  {subject}
                </HeroSelectItem>
              ))}
            </HeroSelect>
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
              <HeroSelect
                selectedKeys={newClass.yearGrade ? [newClass.yearGrade] : []}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  setNewClass({ ...newClass, yearGrade: selectedKey });
                }}
                classNames={{
                  base: "w-full",
                  trigger: "bg-gray-50 border border-gray-300 hover:border-gray-400 rounded-md",
                  value: "text-sm pr-8",
                  selectorIcon: "right-2"
                }}
                radius="sm"
                size="md"
                variant="bordered"
              >
                {GRADES.map((year) => (
                  <HeroSelectItem key={year} value={year}>
                    {year}
                  </HeroSelectItem>
                ))}
              </HeroSelect>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Monthly Fee (Rs.)</label>
              <HeroInput
                type="number"
                placeholder="Enter fee amount"
                value={newClass.monthlyFee}
                onChange={(e) =>
                  setNewClass({ ...newClass, monthlyFee: e.target.value })
                }
                classNames={{
                  base: "w-full",
                  input: "text-sm",
                  inputWrapper: "bg-gray-50 border border-gray-300 hover:border-gray-400 rounded-md"
                }}
                radius="sm"
                size="md"
                variant="bordered"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <DatePicker
                label="Starting Date"
                value={dateStringToCalendarDate(newClass.startDate)}
                onChange={(date) => {
                  const dateString = calendarDateToDateString(date);
                  setNewClass({ ...newClass, startDate: dateString });
                }}
                minValue={new CalendarDate(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate())}
                classNames={{
                  base: "w-full",
                  input: "text-sm",
                  inputWrapper: "bg-gray-50 border border-gray-300 hover:border-gray-400 rounded-md"
                }}
                radius="sm"
                size="md"
                variant="bordered"
                showMonthAndYearPickers
                calendarProps={{
                  classNames: {
                    base: "bg-white shadow-lg border border-gray-200",
                    headerWrapper: "pt-4 pb-2",
                    prevButton: "text-gray-600 hover:text-gray-800",
                    nextButton: "text-gray-600 hover:text-gray-800",
                    gridHeader: "text-gray-500 text-xs font-medium",
                    gridBodyRow: "border-none",
                    cellButton: "hover:bg-gray-100 data-[selected=true]:bg-blue-500 data-[selected=true]:text-white"
                  }
                }}
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

            {/* Time Slot Rows */}
            {newClass.timeSlots.map((slot, index) => (
              <div key={index}>
                {/* Desktop Layout */}
                <div className="hidden sm:grid grid-cols-[200px_1fr_auto] gap-3 items-start">
                  <HeroSelect
                    label="Day"
                    selectedKeys={slot.day ? [slot.day] : []}
                    onSelectionChange={(keys) => {
                      const selectedKey = Array.from(keys)[0] as string;
                      updateTimeSlot(index, 'day', selectedKey);
                    }}
                    classNames={{
                      base: "w-full",
                      trigger: "bg-gray-50 border border-gray-300 hover:border-gray-400 rounded-md",
                      value: "text-sm pr-8",
                      selectorIcon: "right-2"
                    }}
                    radius="sm"
                    size="md"
                    variant="bordered"
                  >
                    {DAYS_OF_WEEK.map((day) => (
                      <HeroSelectItem key={day.toLowerCase()} value={day.toLowerCase()}>
                        {day}
                      </HeroSelectItem>
                    ))}
                  </HeroSelect>

                  <div className="grid grid-cols-2 gap-3">
                    <TimeInput
                      label="Start Time"
                      value={timeStringToTime(slot.startTime)}
                      onChange={(time) => updateTimeSlotWithTime(index, 'startTime', time)}
                      classNames={{
                        base: "w-full",
                        input: "text-sm",
                        inputWrapper: "bg-gray-50 border border-gray-300 hover:border-gray-400 rounded-md"
                      }}
                      radius="sm"
                      size="md"
                      variant="bordered"
                      hourCycle={12}
                      granularity="minute"
                    />
                    <TimeInput
                      label="End Time"
                      value={timeStringToTime(slot.endTime)}
                      onChange={(time) => updateTimeSlotWithTime(index, 'endTime', time)}
                      classNames={{
                        base: "w-full",
                        input: "text-sm",
                        inputWrapper: "bg-gray-50 border border-gray-300 hover:border-gray-400 rounded-md"
                      }}
                      radius="sm"
                      size="md"
                      variant="bordered"
                      hourCycle={12}
                      granularity="minute"
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
                      <HeroSelect
                        label="Day"
                        selectedKeys={slot.day ? [slot.day] : []}
                        onSelectionChange={(keys) => {
                          const selectedKey = Array.from(keys)[0] as string;
                          updateTimeSlot(index, 'day', selectedKey);
                        }}
                        classNames={{
                          base: "w-full",
                          trigger: "bg-gray-50 border border-gray-300 hover:border-gray-400 rounded-md",
                          value: "text-sm pr-8",
                          selectorIcon: "right-2"
                        }}
                        radius="sm"
                        size="md"
                        variant="bordered"
                      >
                        {DAYS_OF_WEEK.map((day) => (
                          <HeroSelectItem key={day.toLowerCase()} value={day.toLowerCase()}>
                            {day}
                          </HeroSelectItem>
                        ))}
                      </HeroSelect>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <TimeInput
                          label="Start Time"
                          value={timeStringToTime(slot.startTime)}
                          onChange={(time) => updateTimeSlotWithTime(index, 'startTime', time)}
                          classNames={{
                            base: "w-full",
                            input: "text-sm",
                            inputWrapper: "bg-gray-50 border border-gray-300 hover:border-gray-400 rounded-md"
                          }}
                          radius="sm"
                          size="md"
                          variant="bordered"
                          hourCycle={12}
                          granularity="minute"
                        />
                      </div>
                      <div className="space-y-2">
                        <TimeInput
                          label="End Time"
                          value={timeStringToTime(slot.endTime)}
                          onChange={(time) => updateTimeSlotWithTime(index, 'endTime', time)}
                          classNames={{
                            base: "w-full",
                            input: "text-sm",
                            inputWrapper: "bg-gray-50 border border-gray-300 hover:border-gray-400 rounded-md"
                          }}
                          radius="sm"
                          size="md"
                          variant="bordered"
                          hourCycle={12}
                          granularity="minute"
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
