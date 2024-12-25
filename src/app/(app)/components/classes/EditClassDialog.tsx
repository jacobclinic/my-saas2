'use client';

import React, { useEffect, useState } from 'react';
import { Input } from "../base-v2/ui/Input";
import { Textarea } from "../base-v2/ui/Textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../base-v2/ui/Select";
import { X, Plus, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from "../base-v2/ui/Alert";
import BaseDialog from '../base-v2/BaseDialog';
import { TimeSlot, EditClassData, ClassListData } from '~/lib/classes/types/class-v2';
import { Button } from '../base-v2/ui/Button';
import { DAYS_OF_WEEK, GRADES, SUBJECTS } from '~/lib/constants-v2';

interface EditClassDialogProps {
  open: boolean;
  onClose: () => void;
  onUpdateClass: (classId: number, classData: EditClassData) => void;
  classData: ClassListData | null;
  loading?: boolean;
}

const EditClassDialog: React.FC<EditClassDialogProps> = ({
  open,
  onClose,
  onUpdateClass,
  classData,
  loading = false
}) => {
  const [editedClass, setEditedClass] = useState<EditClassData>({
    name: '',
    subject: '',
    description: '',
    yearGrade: '',
    monthlyFee: '',
    startDate: '',
    timeSlots: [{ day: '', time: '' }],
    status: 'active'
  });

  useEffect(() => {
    if (classData) {
      // Parse the schedule string to extract time slots
      const scheduleTimeSlots = parseScheduleToTimeSlots(classData.schedule);
      
      setEditedClass({
        name: classData.name,
        subject: classData.subject || '',
        description: '',  // You might want to fetch this from the API
        yearGrade: classData.academicYear || '',
        monthlyFee: '', // You might want to fetch this from the API
        startDate: '', // You might want to fetch this from the API
        timeSlots: scheduleTimeSlots,
        status: classData.status as 'active' | 'inactive' | 'draft' || 'active'
      });
    }
  }, [classData]);

  const parseScheduleToTimeSlots = (schedule: string): TimeSlot[] => {
    // Example schedule: "Every Monday and Wednesday, 4:00 PM"
    const timeSlots: TimeSlot[] = [];
    
    try {
      const days = schedule.toLowerCase().match(/monday|tuesday|wednesday|thursday|friday|saturday|sunday/g) || [];
      const time = schedule.match(/\d{1,2}:\d{2}\s?[AP]M/i)?.[0] || '';
      
      days.forEach(day => {
        timeSlots.push({
          day: day.toLowerCase(),
          time: time
        });
      });
      
      return timeSlots.length > 0 ? timeSlots : [{ day: '', time: '' }];
    } catch (error) {
      console.error('Error parsing schedule:', error);
      return [{ day: '', time: '' }];
    }
  };

  const handleAddTimeSlot = () => {
    setEditedClass(prev => ({
      ...prev,
      timeSlots: [...prev.timeSlots, { day: '', time: '' }]
    }));
  };

  const handleRemoveTimeSlot = (index: number) => {
    setEditedClass(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.filter((_, i) => i !== index)
    }));
  };

  const updateTimeSlot = (index: number, field: keyof TimeSlot, value: string) => {
    setEditedClass(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.map((slot, i) => 
        i === index ? { ...slot, [field]: value } : slot
      )
    }));
  };

  const handleSubmit = () => {
    if (classData) {
      onUpdateClass(classData.id, editedClass);
    }
  };

  const isValid =
    editedClass.name &&
    editedClass.subject &&
    editedClass.monthlyFee &&
    editedClass.yearGrade &&
    editedClass.startDate &&
    editedClass.timeSlots.every((slot) => slot.day && slot.time);

  const statuses = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'draft', label: 'Draft' }
  ];

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title="Edit Class"
      description="Update your class details and schedule"
      maxWidth="xl"
      onConfirm={handleSubmit}
      confirmButtonText="Save Changes"
      loading={loading}
      confirmButtonVariant={isValid ? 'default' : 'secondary'}
    >
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Class Name</label>
          <Input 
            placeholder="Enter class name"
            value={editedClass.name}
            onChange={(e) => setEditedClass({ ...editedClass, name: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Subject</label>
            <Select 
              value={editedClass.subject} 
              onValueChange={(value) => setEditedClass({ ...editedClass, subject: value })}
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
            <label className="text-sm font-medium">Status</label>
            <Select 
              value={editedClass.status} 
              onValueChange={(value: 'active' | 'inactive' | 'draft') => 
                setEditedClass({ ...editedClass, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map(status => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
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
            onChange={(e) => setEditedClass({ ...editedClass, description: e.target.value })}
            className="h-24"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Year/Grade</label>
            <Select 
              value={editedClass.yearGrade} 
              onValueChange={(value) => setEditedClass({ ...editedClass, yearGrade: value })}
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
              value={editedClass.monthlyFee}
              onChange={(e) => setEditedClass({ ...editedClass, monthlyFee: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Starting Date</label>
          <Input 
            type="date"
            value={editedClass.startDate}
            onChange={(e) => setEditedClass({ ...editedClass, startDate: e.target.value })}
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
            {editedClass.timeSlots.map((slot, index) => (
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

                {editedClass.timeSlots.length > 1 && (
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

        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-700">
            Changes to the class schedule will affect all enrolled students. Make sure to notify them of any changes.
          </AlertDescription>
        </Alert>
      </div>
    </BaseDialog>
  );
};

export default EditClassDialog;