'use client';

import { useCallback, useState } from 'react';
import ModalComponent from '../base/ModalComponent';
import { TextFieldInput, TextFieldLabel } from '~/core/ui/TextField';
import { Section, SectionBody, SectionHeader } from '~/core/ui/Section';
import SelectComponent from '../base/SelectComponent';
import useUpdateClassMutation from '~/lib/classes/hooks/use-update-class';
import ClassType from '~/lib/classes/types/class';
import { useRouter } from 'next/navigation';

type UpdateClassModalProps = {
  classData: ClassType;
};

export default function UpdateClassModal({ classData }: UpdateClassModalProps) {
  const [name, setName] = useState(classData.name);
  const [description, setDescription] = useState(classData.description || '');
  const [subject, setSubject] = useState(classData.subject);
  const [tutor, setTutor] = useState(classData.tutor);
  const [fee, setFee] = useState<number>(classData.fee || 0);

  const updateClassMutation = useUpdateClassMutation();
  const router = useRouter();

  const resetToDefaultValues = () => {
    setName(classData.name);
    setDescription(classData.description || '');
    setSubject(classData.subject);
    setTutor(classData.tutor);
    setFee(classData.fee || 0);
  };

  const handleSelectSubjectChange = (value: string) => {
    setSubject(value);
  };

  const handleSelectTutorChange = (value: string) => {
    setTutor(value);
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
    const updatedClass: Partial<ClassType> = {
      // ...classData,
      name,
      description,
      subject,
      tutor,
      fee,
    };
    console.log('updatedClass:', updatedClass);

    try {
      await updateClassMutation.trigger({ classId: classData.id, classData: updatedClass });
      resetToDefaultValues();
      router.refresh();
    } catch (error) {
      console.error('Error updating class:', error);
    }
  }, [router, updateClassMutation, name, description, subject, tutor, fee, classData]);

  return (
    <ModalComponent
      modalName={`Update`}
      heading="Update"
      onConfirm={handleUpdateClass}
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
        </SectionBody>
      </Section>
    </ModalComponent>
  );
}
