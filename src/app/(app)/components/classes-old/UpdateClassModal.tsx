'use client';

import { useCallback, useState, useTransition } from 'react';
import ModalComponent from '../base/ModalComponent';
import { TextFieldInput, TextFieldLabel } from '~/core/ui/TextField';
import { Section, SectionBody, SectionHeader } from '~/core/ui/Section';
import SelectComponent from '../base/SelectComponent';
import useUpdateClassMutation from '~/lib/classes/hooks/use-update-class';
import ClassType, { TimeSlot, ClassWithTutorAndEnrollment } from '~/lib/classes/types/class';
import { useRouter } from 'next/navigation';
import { DeleteIcon, EditIcon } from '~/assets/images/react-icons';
import Button from '~/core/ui/Button';
import { updateClassAction } from '~/lib/classes/server-actions';
import useCsrfToken from '~/core/hooks/use-csrf-token';
import { useClassesDataQueryRevalidate } from '~/lib/classes/hooks/use-fetch-class';
import { TIME_SLOT_DAY_OPTIONS } from '~/lib/classes/constants/class';

export default function UpdateClassModal({ classData }: { classData: ClassWithTutorAndEnrollment }) {
  // console.log("classData", classData);
  const [name, setName] = useState(classData.name);
  const [description, setDescription] = useState(classData.description || '');
  const [subject, setSubject] = useState(classData.subject);
  const [tutor, setTutor] = useState(classData.tutorId);
  const [fee, setFee] = useState<number>(classData.fee || 0);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(classData.timeSlots || [{ day: "", time: "", duration: "", reccurringPattern: "" }]);

  const [isMutating, startTransition] = useTransition();
  const csrfToken = useCsrfToken();
  const { revalidateClassesDataFetch } = useClassesDataQueryRevalidate();

  const resetToDefaultValues = useCallback(() => {
    setName(classData.name);
    setDescription(classData.description || '');
    setSubject(classData.subject);
    setTutor(classData.tutorId);
    setFee(classData.fee || 0);
    setTimeSlots(classData.timeSlots || [{ day: "", time: "", duration: "", reccurringPattern: "" }]);
  }, [classData]);

  const handleSelectSubjectChange = (value: string) => {
    setSubject(value);
  };

  const handleSelectTutorChange = (value: string) => {
    setTutor(value);
  };

  const handleTimeSlotChange = (index: number, field: keyof TimeSlot, value: string) => {
    const updatedTimeSlots = [...timeSlots];
    updatedTimeSlots[index][field] = value;
    setTimeSlots(updatedTimeSlots);
  };

  const addTimeSlot = () => {
    setTimeSlots([...timeSlots, { day: "", time: "", duration: "", reccurringPattern: "" }]);
  };

  const removeTimeSlot = (index: number) => {
    const updatedTimeSlots = timeSlots.filter((_, i) => i !== index);
    setTimeSlots(updatedTimeSlots);
  };

  const subjectOptions = [
    { label: 'Math', value: 'math' },
    { label: 'Economics', value: 'economics' },
    { label: 'Physics', value: 'physics' },
    { label: 'Chemistry', value: 'chemistry' },
    { label: 'Biology', value: 'biology' },
  ];

  const tutorOptions = [
    { label: 'John Doe', value: '95572317-8cf6-4b15-bd5a-e8ccf420110f' },
    // Add more tutors here...
  ];

  const handleUpdateClass = useCallback(async () => {
    const filteredTimeSlots = timeSlots.filter((timeSlot) => timeSlot.day && timeSlot.time);

    const updatedClass: Partial<ClassType> = {
      // ...classData,
      name,
      description,
      subject,
      tutorId: tutor,
      fee,
      timeSlots: filteredTimeSlots,
    };
    // console.log('updatedClass:', updatedClass);

    try {
      startTransition(async () => {
        await updateClassAction({ classId: classData.id, classData: updatedClass, csrfToken});
        revalidateClassesDataFetch();
      });

      // await updateClassMutation.trigger({ classId: classData.id, classData: updatedClass });
      resetToDefaultValues();
    
      // // redirect to /classse
      // return router.push(`/classes`);
    } catch (error) {
      console.error('Error updating class:', error);
    }
  }, [timeSlots, name, description, subject, tutor, fee, classData.id, resetToDefaultValues, csrfToken, revalidateClassesDataFetch]);

  return (
    <ModalComponent
      modalName={<EditIcon />}
      heading="Update"
      onConfirm={handleUpdateClass}
      onCancel={resetToDefaultValues}
      width="600px"
    >
      <Section>
        <SectionHeader
          title="Update Class Details"
          description="Modify the class details below."
        />
        <SectionBody className="space-y-4">
          <TextFieldLabel className="flex flex-col items-start justify-start">
            Name
            <TextFieldInput
              placeholder="Enter the name"
              required
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            />
          </TextFieldLabel>
          <TextFieldLabel className="flex flex-col items-start justify-start">
            Description
            <TextFieldInput
              placeholder="Enter the description"
              value={description}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
            />
          </TextFieldLabel>
          <TextFieldLabel className="flex flex-col items-start justify-start">
            Subject
            <SelectComponent
              options={subjectOptions}
              placeholder="Select a subject..."
              onChange={handleSelectSubjectChange}
              value={subject}
              className="w-full"
            />
          </TextFieldLabel>
          <TextFieldLabel className="flex flex-col items-start justify-start">
            Tutor
            <SelectComponent
              options={tutorOptions}
              placeholder="Select a tutor..."
              onChange={handleSelectTutorChange}
              value={tutor}
              className="w-full"
            />
          </TextFieldLabel>
          <TextFieldLabel className="flex flex-col items-start justify-start">
            Fee
            <TextFieldInput
              type="number"
              placeholder="Enter the fee"
              value={fee}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFee(Number(e.target.value))}
            />
          </TextFieldLabel>
          <TextFieldLabel className="flex flex-col items-start justify-start">
            Class default sessions
            {timeSlots.map((slot, index) => (
              <div key={index} className="flex gap-4 w-full mb-2 justify-between">
                <TextFieldLabel className="flex flex-row items-center justify-start gap-1 flex-1">
                  Day:
                  <SelectComponent
                    options={TIME_SLOT_DAY_OPTIONS}
                    placeholder="Select the day"
                    onChange={(value) => handleTimeSlotChange(index, "day", value)}
                    value={slot.day}
                    className="w-full"
                    required
                  />
                </TextFieldLabel>
                <TextFieldLabel className="flex flex-row items-center justify-start gap-1 flex-1">
                  Time:
                  <TextFieldInput
                    type="time"
                    className='justify-end'
                    placeholder="Enter the time"
                    value={slot.time}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleTimeSlotChange(index, "time", e.target.value)
                    }
                    required
                  />
                </TextFieldLabel>
                {index ? (
                  <Button
                    variant="custom"
                    size="custom"
                    onClick={() => removeTimeSlot(index)}
                    className="self-center"
                  >
                    <DeleteIcon />
                  </Button>
                ) : timeSlots.length > 1 ? (
                  <Button
                    variant="custom"
                    size="custom"
                    className="self-center text-transparent cursor-default"
                  >
                    <DeleteIcon />
                  </Button>
                ) : null}
              </div>
            ))}
            <Button variant="secondary" className="self-end" onClick={addTimeSlot}>
              Add another slot
            </Button>
          </TextFieldLabel>
        </SectionBody>
      </Section>
    </ModalComponent>
  );
}
