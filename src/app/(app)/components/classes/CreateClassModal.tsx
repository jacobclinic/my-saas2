'use client';

import { useCallback, useState } from 'react';
import ModalComponent from '../base/ModalComponent';
import { TextFieldInput, TextFieldLabel } from '~/core/ui/TextField';
import { Section, SectionBody, SectionHeader } from '~/core/ui/Section';
import { Select } from '~/core/ui/Select';
import SelectComponent from '../base/SelectComponent';
import useCreateClassMutation from '~/lib/classes/hooks/use-create-class';
import ClassType from '~/lib/classes/types/class';
import { useRouter } from 'next/navigation';

export default function CreateClassModal() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [tutor, setTutor] = useState('');
  const [fee, setFee] = useState<number>(0);

  const createClassMutation = useCreateClassMutation();
  const router = useRouter();

  const resetToDefaultValues = () => {
    setName('');
    setDescription('');
    setSubject('');
    setTutor('');
    setFee(0);
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
    // Create a new class object with the current state values
    const newClass: Omit<ClassType, 'id'> = {
      name,
      description,
      subject,
      tutor,
      fee,
    }
    console.log("newClass-1",newClass);

    // create task
    await createClassMutation.trigger(newClass);
    resetToDefaultValues();    
    // redirect to /tasks
    return router.push(`/classes`);
  }, [router, createClassMutation, name, description, subject, tutor, fee])
 
  return (
    <div>
      <ModalComponent
        modalName='Create a Class'   
        heading='Create a Class'
        onConfirm={handleCreateClass}
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
          </SectionBody>
        </Section>
      </ModalComponent>
    </div>
  );
}
