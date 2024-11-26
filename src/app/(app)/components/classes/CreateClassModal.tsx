'use client';

import { useState } from 'react';
import ModalComponent from '../base/ModalComponent';
import { TextFieldInput, TextFieldLabel } from '~/core/ui/TextField';
import { Section, SectionBody, SectionHeader } from '~/core/ui/Section';
import { Select } from '~/core/ui/Select';
import SelectComponent from '../base/SelectComponent';

export interface ClassType {
  id: string; // Database generated
  name: string;
  description: string;
  subject: string; // Selected or newly created
  tutor: string; // Selected from dropdown
  students: string[]; // Selected from dropdown
  sessions: string[]; // Selected from dropdown
  material: File[]; // Uploaded files
  fee: number; // Numeric input
  payment: string[]; // Selected payment methods
  status: 'Active' | 'Inactive' | 'Cancelled'; // Default to 'Active'
}

export default function CreateClassModal() {
  const [className, setClassName] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [tutor, setTutor] = useState('');
  const [students, setStudents] = useState<string[]>([]);
  const [sessions, setSessions] = useState<string[]>([]);
  const [material, setMaterial] = useState<File[]>([]);
  const [fee, setFee] = useState<number>(0);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [status, setStatus] = useState<'Active' | 'Inactive' | 'Cancelled'>('Active');

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setClassName(event.target.value); // Update state with the input value
  };

  const handleSelectSubjectChange = (value: string) => {
    setSubject(value); // Update state with the selected value
    console.log('Selected fruit:', value); // Log the selected value
  };

  const handleSelectTutorChange = (value: string) => {
    setTutor(value); // Update state with the selected value
    console.log('Selected fruit:', value); // Log the selected value
  };
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setMaterial([...material, ...Array.from(event.target.files)]);
    }
  };

  const subjectOptions = [
    { label: 'Math', value: 'math' },
    { label: 'Economics', value: 'economics' },
    { label: 'Physics', value: 'physics' },
    { label: 'Chemistry', value: 'chemistry' },
    { label: 'Biology', value: 'biology' },
  ];

  const tutorOptions = [
    { label: 'John Doe', value: 'id1' },
    { label: 'Jane Doe', value: 'id2' },
    { label: 'John Smith', value: 'id3' },
  ];
 
  return (
    <div>
      <ModalComponent
        modalName='Create a Class'   
        heading='Create a Class'       
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
                value={className}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setClassName(e.target.value)}
              />
            </TextFieldLabel>
            <TextFieldLabel className='flex flex-col items-start justify-start'>
              Description
              <TextFieldInput
                placeholder="Enter the description"
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
              />              
            </TextFieldLabel>
            <TextFieldLabel className='flex flex-col items-start justify-start'>
              Tutor
              <SelectComponent
                options={tutorOptions}
                placeholder="Select a tutor..."
                onChange={handleSelectTutorChange}
                value={subject}
                className="w-full"
              />
            </TextFieldLabel>
            <TextFieldLabel className='flex flex-col items-start justify-start'>
              Students
              <select
                multiple
                value={students}
                onChange={(e) =>
                  setStudents(Array.from(e.target.selectedOptions, (option) => option.value))
                }
                className="border rounded px-3 py-2"
              >
                {/* Dynamically populate options */}
                <option value="Student 1">Student 1</option>
                <option value="Student 2">Student 2</option>
              </select>
            </TextFieldLabel>
            <TextFieldLabel className='flex flex-col items-start justify-start'>
              Sessions
              <select
                multiple
                value={sessions}
                onChange={(e) =>
                  setSessions(Array.from(e.target.selectedOptions, (option) => option.value))
                }
                className="border rounded px-3 py-2"
              >
                {/* Dynamically populate options */}
                <option value="Session 1">Session 1</option>
                <option value="Session 2">Session 2</option>
              </select>
            </TextFieldLabel>
            <TextFieldLabel className='flex flex-col items-start justify-start'>
              Material
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="border rounded px-3 py-2 w-full"
              />
            </TextFieldLabel>
            <TextFieldLabel className='flex flex-col items-start justify-start'>
              Fee
              <TextFieldInput
                type="number"
                placeholder="Enter the fee"
                value={fee}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFee(Number(e.target.value))}
              />
            </TextFieldLabel>
            <TextFieldLabel className='flex flex-col items-start justify-start'>
              Payment Methods
              <select
                multiple
                value={paymentMethods}
                onChange={(e) =>
                  setPaymentMethods(Array.from(e.target.selectedOptions, (option) => option.value))
                }
                className="border rounded px-3 py-2"
              >
                {/* Dynamically populate options */}
                <option value="Card">Card</option>
                <option value="Cash">Cash</option>
              </select>
            </TextFieldLabel>
            <TextFieldLabel className='flex flex-col items-start justify-start'>
              Status
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'Active' | 'Inactive' | 'Cancelled')}
                className="border rounded px-3 py-2"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </TextFieldLabel>
          </SectionBody>
        </Section>
        <div>
          
          
        </div>
      </ModalComponent>
    </div>
  );
}
