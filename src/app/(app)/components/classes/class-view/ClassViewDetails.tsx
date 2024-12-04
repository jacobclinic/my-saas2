'use client';

import { Section, SectionBody, SectionHeader } from '~/core/ui/Section';
import HorizontalMainTabs from '../../base/HorizontalMainTabs';
import { TextFieldInput, TextFieldLabel } from '~/core/ui/TextField';
import Button from '~/core/ui/Button';
import Filter from '../../base/Filter';
import { ClassTypeWithTutor } from '~/lib/classes/types/class';
import SelectComponent from '../../base/SelectComponent';
import { useState } from 'react';

interface SearchBarProps {
    classData: ClassTypeWithTutor;
}

export default function ClassViewDetails({ classData }: SearchBarProps) {

    const [name, setName] = useState(classData.name);
    const [subject, setSubject] = useState(classData.subject);
    const [description, setDescription] = useState(classData.description || '');
    const [status, setStatus] = useState(classData.status);
    const [tutor, setTutor] = useState(classData.tutor);
    const [fee, setFee] = useState<number>(classData.fee || 0);

    const tabsArray = [
      { name: 'Details', hasPermission: true },
      { name: 'Students', hasPermission: true },
      { name: 'Sessions', hasPermission: true },
      { name: 'Payments', hasPermission: true },
    ];

    const statusOptions = [
      { label: 'Active', value: 'active' },
      { label: 'Inactive', value: 'inactive' },
      { label: 'Cancelled', value: 'cancelled' },
    ];

    const subjectOptions = [
      { label: 'Math', value: 'math' },
      { label: 'Economics', value: 'economics' },
      { label: 'Physics', value: 'physics' },
      { label: 'Chemistry', value: 'chemistry' },
      { label: 'Biology', value: 'biology' },
    ];

    const handleSelectStatusChange = (value: string) => {
      setStatus(value);
    };

    const handleSelectSubjectChange = (value: string) => {
      setSubject(value);
    };

    return ( 
        <>
            <Section className='mt-4 flex w-full'>
                <SectionHeader
                    className='flex-1'
                    title={'Class Details'}
                    description={``}
                />
                
                <SectionBody className={'space-y-4 flex-1'}>
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
                        Description
                        <TextFieldInput
                        placeholder="Enter the description"
                        value={description}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
                        />
                    </TextFieldLabel>
                    <TextFieldLabel className="flex flex-col items-start justify-start">
                        Class Fee
                        <TextFieldInput
                        placeholder="Enter the description"
                        value={fee}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFee(+e.target.value)}
                        />
                    </TextFieldLabel>
                    <TextFieldLabel className="flex flex-col items-start justify-start">
                        Status
                        <SelectComponent
                        options={statusOptions}
                        placeholder="Select a status..."
                        onChange={handleSelectStatusChange}
                        value={status}
                        className="w-full"
                        />
                    </TextFieldLabel>
                    {/* <Filter name="Search Filter" placeholder="Search by an attribute" width='150px' options={filterOptions}/> */}
                    <div className="flex gap-3 justify-end">
                        <div className="flex justify-end min-w-24">
                            <Button variant="default">Save</Button>
                        </div>
                        <Button variant="secondary">
                            Cancel
                        </Button>
                    </div>
                </SectionBody>
            </Section>
        </>
    )
}