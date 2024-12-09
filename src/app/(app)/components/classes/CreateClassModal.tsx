'use client';

import { useCallback, useState, useTransition } from 'react';
import ModalComponent from '../base/ModalComponent';
import { TextFieldInput, TextFieldLabel } from '~/core/ui/TextField';
import { Section, SectionBody, SectionHeader } from '~/core/ui/Section';
import { Select } from '~/core/ui/Select';
import SelectComponent from '../base/SelectComponent';
import useCreateClassMutation from '~/lib/classes/hooks/use-create-class';
import ClassType, { TimeSlot } from '~/lib/classes/types/class';
import { useRouter } from 'next/navigation';
import useCsrfToken from '~/core/hooks/use-csrf-token';
import { createClassAction } from '~/lib/classes/server-actions';
import Button from '~/core/ui/Button';
import { DeleteIcon } from '~/assets/images/react-icons';

export default function CreateClassModal() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [tutor, setTutor] = useState('');
  const [fee, setFee] = useState<number>(0);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([{ day: "", time: "" }]);

  const [isMutating, startTransition] = useTransition();
  const csrfToken = useCsrfToken();

  const createClassMutation = useCreateClassMutation();
  const router = useRouter();

  const resetToDefaultValues = () => {
    setName('');
    setDescription('');
    setSubject('');
    setTutor('');
    setFee(0);
    setTimeSlots([{ day: "", time: "" }]);
  }

  const handleSelectSubjectChange = (value: string) => {
    setSubject(value); // Update state with the selected value
    console.log('Selected fruit:', value); // Log the selected value
  };

  const handleSelectTutorChange = (value: string) => {
    setTutor(value); // Update state with the selected value
    console.log('Selected fruit:', value); // Log the selected value
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
    // { label: 'Jane Doe', value: '95572317-8cf6-4b15-bd5a-e8ccf420110f' },
    // { label: 'John Smith', value: '95572317-8cf6-4b15-bd5a-e8ccf420110f' },
  ];

  const handleCreateClass = useCallback(async () => {
    const filteredTimeSlots = timeSlots.filter((timeSlot) => timeSlot.day && timeSlot.time);

    // Create a new class object with the current state values
    const newClass: Omit<ClassType, 'id'> = {
      name,
      description,
      subject,
      tutor,
      fee,
      timeSlots: filteredTimeSlots,
    }
    console.log("newClass-1",newClass);

    startTransition(async () => {
      await createClassAction({ classData: newClass, csrfToken });
      // router.push('/classes');
      console.log("Before refresh");

      setTimeout(() => {
        router.refresh();        
      }, 1000);


      // router.replace(router.asPath);
      console.log("After refresh");
    });

    // // create task
    // await createClassMutation.trigger(newClass);

    resetToDefaultValues();    
    
    // // redirect to /tasks
    // return router.push(`/classes`);
  }, [router, csrfToken, name, description, subject, tutor, fee])

  // Handle input change for day or time
  const handleTimeSlotChange = (index: number, field: keyof TimeSlot, value: string) => {
    const updatedTimeSlots: TimeSlot[] = [...timeSlots];
    updatedTimeSlots[index][field] = value;
    setTimeSlots(updatedTimeSlots);
    console.log("updatedTimeSlots",updatedTimeSlots);
  };

  // Add a new empty time slot
  const addTimeSlot = () => {
    setTimeSlots([...timeSlots, { day: "", time: "" }]);
  };

  // Optionally handle removing a time slot
  const removeTimeSlot = (index: number) => {
    const updatedTimeSlots = timeSlots.filter((_, i) => i !== index);
    setTimeSlots(updatedTimeSlots);
  };

  const timeSlotDayOptions = [
    { label: 'Monday', value: 'Monday' },
    { label: 'Tuesday', value: 'Tuesday' },
    { label: 'Wednesday', value: 'Wednesday' },
    { label: 'Thursday', value: 'Thursday' },
    { label: 'Friday', value: 'Friday' },
    { label: 'Saturday', value: 'Saturday' },
    { label: 'Sunday', value: 'Sunday' },
  ]
 
  return (
    <div>
      <ModalComponent
        modalName='Create a Class'   
        heading='Create a Class'
        onConfirm={handleCreateClass}
        onCancel={resetToDefaultValues}
        width="750px"
      >
        <Section>
          <SectionHeader
            title={'Class Details'}
            description={`Please enter the class details below.`}
          />
          <SectionBody className={'space-y-4'}>
            <TextFieldLabel className='flex flex-col items-start justify-start'>
              Name
              <TextFieldInput
                placeholder="Enter the name"
                required
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              />
            </TextFieldLabel>
            <TextFieldLabel className='flex flex-col items-start justify-start'>
              Description
              <TextFieldInput
                placeholder="Enter the description"
                required
                value={description}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
              />
            </TextFieldLabel>
            <TextFieldLabel className='flex flex-col items-start justify-start'>
              Subject
              <SelectComponent
                options={subjectOptions}
                placeholder="Select a subject..."
                onChange={handleSelectSubjectChange}
                value={subject}
                className="w-full"
                required
              />              
            </TextFieldLabel>
            <TextFieldLabel className='flex flex-col items-start justify-start'>
              Tutor
              <SelectComponent
                options={tutorOptions}
                placeholder="Select a tutor..."
                onChange={handleSelectTutorChange}
                value={tutor}
                className="w-full"
                required
              />
            </TextFieldLabel>
            <TextFieldLabel className='flex flex-col items-start justify-start'>
              Fee
              <TextFieldInput
                type="number"
                placeholder="Enter the fee"
                required
                value={fee}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFee(Number(e.target.value))}
              />
            </TextFieldLabel>
            <TextFieldLabel className='flex flex-col items-start justify-start'>
              Class default sessions
              {timeSlots.map((slot, index) => (
                <div key={index} className="flex gap-4 w-full mb-2 justify-between">
                  <TextFieldLabel className="flex flex-row items-center justify-start gap-1 flex-1">
                    Day:
                    <SelectComponent
                      options={timeSlotDayOptions}
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
                      className='justify-end'
                      type="time"
                      placeholder="Enter the time"
                      required
                      value={slot.time}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleTimeSlotChange(index, "time", e.target.value)}
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
              <Button
                variant="secondary"
                className='self-end'
                onClick={addTimeSlot}
              >
                Add another slot
              </Button>
            </TextFieldLabel>
          </SectionBody>
        </Section>
      </ModalComponent>
    </div>
  );
}
