'use client';

import { useState } from 'react';
import ModalComponent from '../base/ModalComponent';
import { TextFieldInput, TextFieldLabel } from '~/core/ui/TextField';
import { Section, SectionBody, SectionHeader } from '~/core/ui/Section';

export default function CreateClassModal() {
  const [className, setClassName] = useState('');

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setClassName(event.target.value); // Update state with the input value
  };
 
  return (
    <div>
      <ModalComponent
        modalName='Create a Class'   
        heading='Create a Class'       
      >
        <Section>
          <SectionHeader
            title={'Your Details'}
            description={`Please enter your details below.`}
          />
        
          <SectionBody className={'space-y-4'}>
            <TextFieldLabel className='flex flex-col items-start justify-start'>
              Name
            <TextFieldInput
                placeholder="Enter the name"
                value={className}
                onChange={handleInputChange} 
            />
            </TextFieldLabel>
            <TextFieldLabel className='flex flex-col items-start justify-start'>
              Description
            <TextFieldInput
                placeholder="Enter the descripton"
                value={className}
                onChange={handleInputChange} 
            />
            </TextFieldLabel>
          </SectionBody>
        </Section>
        <div>
          
          
        </div>
      </ModalComponent>
    </div>
  );
}
