'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { Input } from '../../base-v2/ui/Input';
import { Textarea } from '../../base-v2/ui/Textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../base-v2/ui/Select';
import TimezoneIndicator from '../../TimezoneIndicator';
import { DAYS_OF_WEEK, GRADES, SUBJECTS } from '~/lib/constants-v2';
import { getTodayInLocalTimezone } from '~/lib/utils/date-utils';
import useCsrfToken from '~/core/hooks/use-csrf-token';
import { createClassByAdminAction } from '~/lib/classes/server-actions-v2';
import { useToast } from '../../../lib/hooks/use-toast';
import BaseDialog from '../../base-v2/BaseDialog';
import {
  CreateClassPayload,
  DbClassType,
  TimeSlot,
} from '~/lib/classes/types/class-v2';
import Button from '~/core/ui/Button';
import { Plus, X } from 'lucide-react';
import SearchableSelect from '../../base-v2/ui/SearchableSelect';
import { Json } from '~/database.types-backup';

interface TutorOption {
  id: string;
  name: string;
}

interface AdminCreateClassDialogProps {
  open: boolean;
  onClose: () => void;
  onCreateClass?: (classData: DbClassType) => void;
  loading?: boolean;
  tutors: TutorOption[];
}

const AdminCreateClassDialog: React.FC<AdminCreateClassDialogProps> = ({
  open,
  onClose,
  onCreateClass,
  loading = false,
  tutors,
}) => {
  const [isPending, startTransition] = useTransition();
  const csrfToken = useCsrfToken();
  const { toast } = useToast();

  const today = getTodayInLocalTimezone();
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [newClass, setNewClass] = useState<DbClassType>({
    created_at: '',
    description: '',
    end_date: null,
    fee: 0,
    grade: '',
    id: '',
    name: '',
    short_url_code: null,
    starting_date: '',
    status: '',
    subject: '',
    time_slots: [
      { day: '', startTime: '', endTime: '', timezone: userTimezone } as Json,
    ],
    tutor_id: '',
  });

  const [allFilled, setAllFilled] = useState<boolean>(false);

  const handleAddTimeSlot = () => {
    setNewClass((prev) => ({
      ...prev,
      time_slots: [
        ...prev.time_slots,
        { day: '', startTime: '', endTime: '', timezone: userTimezone } as Json,
      ],
    }));
  };

  const handleRemoveTimeSlot = (index: number) => {
    setNewClass((prev) => ({
      ...prev,
      time_slots: prev.time_slots.filter((_, i) => i !== index),
    }));
  };

  const updateTimeSlot = (
    index: number,
    field: keyof TimeSlot,
    value: string,
  ) => {
    setNewClass((prev: DbClassType) => {
      const updatedTimeSlots = prev.time_slots.map((slot, i) => {
        const ts = slot as unknown as Json[];
        return i === index ? { ...ts, [field]: value } : ts;
      });

      return {
        ...prev,
        time_slots: updatedTimeSlots as Json[],
      };
    });
  };

  const handleSubmit = () => {
    const startDate = new Date(newClass.starting_date).toISOString();
    const classDataPayload: CreateClassPayload = {
      fee: Number(newClass.fee),
      grade: newClass.grade,
      name: newClass.name,
      description: newClass.description,
      starting_date: startDate,
      status: 'active',
      subject: newClass.subject,
      time_slots: newClass.time_slots as unknown as Json[],
      tutor_id: newClass.tutor_id,
    };

    startTransition(async () => {
      const result = await createClassByAdminAction({
        data: classDataPayload,
        csrfToken,
      });

      if (result.success) {
        onClose();
        toast({
          title: 'Success',
          description: 'New class created successfully',
          variant: 'success',
        });
        setNewClass({
          created_at: '',
          description: '',
          end_date: null,
          fee: 0,
          grade: '',
          id: '',
          name: '',
          short_url_code: null,
          starting_date: '',
          status: '',
          subject: '',
          time_slots: [
            {
              day: '',
              startTime: '',
              endTime: '',
              timezone: userTimezone,
            } as Json,
          ],
          tutor_id: '',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to create class',
          variant: 'destructive',
        });
      }
    });
    onCreateClass?.(newClass);
  };

  const isValid = Boolean(
    newClass.name &&
      newClass.subject &&
      newClass.fee &&
      newClass.grade &&
      newClass.starting_date &&
      newClass.tutor_id &&
      newClass.time_slots.every(
        (slot) => {
          const timeSlot = slot as unknown as TimeSlot;
          return timeSlot.day && timeSlot.startTime && timeSlot.endTime;
        },
      ),
  );

  useEffect(() => {
    setAllFilled(isValid);
  }, [isValid]);

  const handleClose = () => {
    onClose();
    setNewClass({
      created_at: '',
      description: '',
      end_date: null,
      fee: 0,
      grade: '',
      id: '',
      name: '',
      short_url_code: null,
      starting_date: '',
      status: '',
      subject: '',
      time_slots: [
        { day: '', startTime: '', endTime: '', timezone: userTimezone } as Json,
      ],
      tutor_id: '',
    });
  };

  return (
    <BaseDialog
      open={open}
      onClose={handleClose}
      title="Create Class Group"
      description="Set up class details and assign a tutor"
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
          <label className="text-sm font-medium">Assign Tutor</label>
          <SearchableSelect
            options={tutors}
            value={newClass.tutor_id}
            onValueChange={(value) =>
              setNewClass({ ...newClass, tutor_id: value })
            }
            placeholder="Search and select a tutor..."
            className="mt-1"
            noResultsText="No tutors found for "
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
            value={newClass.description || ''}
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
              value={newClass.grade}
              onValueChange={(value) =>
                setNewClass({ ...newClass, grade: value })
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
              value={newClass.fee}
              onChange={(e) =>
                setNewClass({ ...newClass, fee: parseInt(e.target.value) })
              }
            />
          </div>
        </div>

        <div className="flex justify-between gap-4">
          <div>
            <label className="text-sm font-medium">Starting Date</label>
            <Input
              type="date"
              value={newClass.starting_date}
              onChange={(e) =>
                setNewClass({ ...newClass, starting_date: e.target.value })
              }
              min={getTodayInLocalTimezone()}
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
            {newClass.time_slots.map((slot, index) => (
              <div key={index} className="flex gap-2 items-start">
                <Select
                  value={(slot as unknown as TimeSlot).day}
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
                    value={(slot as unknown as TimeSlot).startTime}
                    onChange={(e) =>
                      updateTimeSlot(index, 'startTime', e.target.value)
                    }
                    placeholder="Start time"
                  />

                  <Input
                    type="time"
                    value={(slot as unknown as TimeSlot).endTime}
                    onChange={(e) =>
                      updateTimeSlot(index, 'endTime', e.target.value)
                    }
                    placeholder="End time"
                  />
                </div>

                {newClass.time_slots.length > 1 && (
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

export default AdminCreateClassDialog;
