'use client';

import { Section, SectionBody, SectionHeader } from '~/core/ui/Section';
import HorizontalMainTabs from '../base/HorizontalMainTabs';
import { TextFieldInput, TextFieldLabel } from '~/core/ui/TextField';
import Button from '~/core/ui/Button';
import Filter from '../base/Filter';

interface SearchBarProps {
}

export default function ClassView(props: SearchBarProps) {

    const tabsArray = [
      { name: 'Details', hasPermission: true },
      { name: 'Students', hasPermission: true },
      { name: 'Sessions', hasPermission: true },
      { name: 'Payments', hasPermission: true },
    ];

    const filterOptions = [
      { label: 'Economics', value: 'economics' },
      { label: 'Mathematics', value: 'mathematics' },
      { label: 'Physics', value: 'physics' },
      { label: 'Chemistry', value: 'chemistry' },
      { label: 'Biology', value: 'biology' },
    ];

    return ( 
        <>
            <HorizontalMainTabs
                tabs={tabsArray}
            />
            <Section className='mt-4 flex w-full'>
                <SectionHeader
                    className='flex-1'
                    title={'Class Details'}
                    description={``}
                />
                
                <SectionBody className={'space-y-4 flex-1'}>
                    <TextFieldLabel className='flex flex-col items-start justify-start'>
                        Name
                        <TextFieldInput
                            placeholder="Enter the name"
                        />
                    </TextFieldLabel>
                    <TextFieldLabel className='flex flex-col items-start justify-start'>
                        Description
                        <TextFieldInput
                            placeholder="Enter the descripton"
                        />
                    </TextFieldLabel>
                    <Filter name="Search Filter" placeholder="Search by an attribute" width='150px' options={filterOptions}/>
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