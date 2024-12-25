'use client';

import { useCallback, useState, useTransition } from 'react';
import ModalComponent from '../base/ModalComponent';
import { TextFieldInput, TextFieldLabel } from '~/core/ui/TextField';
import { Section, SectionBody, SectionHeader } from '~/core/ui/Section';
import SelectComponent from '../base/SelectComponent';
import { useRouter } from 'next/navigation';
import SessionsType from '~/lib/sessions/types/session';
import useCsrfToken from '~/core/hooks/use-csrf-token';
// import { useSessionsDataQueryRevalidate } from '~/lib/sessions/hooks/use-fetch-session';
import { createSessionAction } from '~/lib/sessions/server-actions';

export default function CreateSessionModal({ classId, revalidateSessionsByClassIdDataFetch }: {
  classId?: string;
  revalidateSessionsByClassIdDataFetch?: () => void
}) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [classForSession, setClassForSession] = useState(classId || '');
  
  const [isMutating, startTransition] = useTransition();
  const csrfToken = useCsrfToken();

  // const { revalidateSessionsDataFetch } = useSessionsDataQueryRevalidate();
  const router = useRouter();

  const resetToDefaultValues = () => {
    setDate('');
    setTime('');
    setTitle('');
    setDescription('');
    setClassForSession('');
  }

  const handleSelectClassChange = (value: string) => {
    setClassForSession(value); // Update state with the selected value
    console.log('Selected fruit:', value); // Log the selected value
  };

  const classForSessionOptions = [
    { label: 'kalum', value: '6d348006-4578-48e6-a1b8-dda8ab7a2b69' },
    { label: 'rrrrrrrrrrr', value: 'dafc400f-9ca2-4283-b517-6b3329a416cc' },
  ];

  const handleCreateClass = useCallback(async () => {
    // Create a new class object with the current state values
    const newSession: Omit<SessionsType, 'id'>  = {
      startTime: new Date(`${date}T${time}:00`).toISOString(),
      classId: classForSession,
      title,
      description,
    }
    console.log("newSession-1",newSession);

    startTransition(async () => {
      await createSessionAction({ sessionData: newSession, csrfToken });
      // revalidateSessionsDataFetch();
      revalidateSessionsByClassIdDataFetch && revalidateSessionsByClassIdDataFetch();
      console.log("newSession-2------222-----",newSession, revalidateSessionsByClassIdDataFetch);
    });


    // // create task
    // await createClassMutation.trigger(newClass);
    resetToDefaultValues();    
    // // redirect to /tasks
    // return router.push(`/classes`);
  }, [classForSession, date, description, time, title])
 
  return (
    <ModalComponent
      modalName='Schedule a Session'   
      heading='Schedule a Session'
      onConfirm={handleCreateClass}
      onCancel={resetToDefaultValues}
      width="750px"
    >
      <Section>
        <SectionHeader
          title={'Session Details'}
          description={`Please enter the session details below.`}
        />
        <SectionBody className={'space-y-4'}>
          <TextFieldLabel className='flex flex-col items-start justify-start'>
            Class Date and Time
            <div className="flex gap-4 w-full mb-2 justify-between">
              <TextFieldLabel className="flex flex-row items-center justify-start gap-1 flex-1">
                Date:
                <TextFieldInput
                  className='justify-end'
                  type="date"
                  placeholder="Enter the Date"
                  required
                  value={date}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDate(e.target.value)}
                />
              </TextFieldLabel>
              <TextFieldLabel className="flex flex-row items-center justify-start gap-1 flex-1">
                Time:
                <TextFieldInput
                  className='justify-end'
                  type="time"
                  placeholder="Enter the time"
                  required
                  value={time}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTime(e.target.value)}
                />
              </TextFieldLabel>
            </div>
          </TextFieldLabel>
          <TextFieldLabel className='flex flex-col items-start justify-start'>
            Title
            <TextFieldInput
              placeholder="Enter the title"
              required
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
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
            Class
            <SelectComponent
              options={classForSessionOptions}
              placeholder="Select a class..."
              onChange={handleSelectClassChange}
              value={classForSession}
              className="w-full"
              disabled={!!classId}
              required
            />
          </TextFieldLabel>
        </SectionBody>
      </Section>
    </ModalComponent>
  );
}
