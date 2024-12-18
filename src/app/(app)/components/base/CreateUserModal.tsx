'use client';

import { useCallback, useState, useTransition } from 'react';
import ModalComponent from './ModalComponent';
import { TextFieldInput, TextFieldLabel } from '~/core/ui/TextField';
import { Section, SectionBody, SectionHeader } from '~/core/ui/Section';
import UserType from '~/lib/user/types/user';
import useCsrfToken from '~/core/hooks/use-csrf-token';
import { createUserByAdminAction } from '~/lib/user/actions.server';
import { USER_ROLES } from '~/lib/constants';

interface CreateUserModalProps {
  userRole: string;
}

export default function CreateUserModal({ 
  userRole, 
}: CreateUserModalProps) {
  const userRoleCapitalized = userRole.charAt(0).toUpperCase() + userRole.slice(1);
  const [email, setEmail] = useState('');
  
  const [isMutating, startTransition] = useTransition();
  const csrfToken = useCsrfToken();

  const resetToDefaultValues = () => {
    setEmail('');
  }

  const handleCreateClass = useCallback(async () => {
    // Create a new class object with the current state values
    const newUser: Omit<UserType, 'id'>  = {
      email,
      userRole,
    }
    console.log("newUser-1",newUser);
    try {
      startTransition(async () => {
        await createUserByAdminAction({ userData: newUser, csrfToken });
        console.log("newUser-2------222-----",newUser);
      });
      
    } catch (error) {
      console.error('Error creating user:', error);      
    }

    resetToDefaultValues();    
  }, [csrfToken, email, userRole])
 
  return (
    <div>
      <ModalComponent
        modalName={`Create ${userRoleCapitalized}`}   
        heading={`Create New ${userRoleCapitalized}`}       
        onConfirm={handleCreateClass}
        onCancel={resetToDefaultValues}
      >
        <Section>
          <SectionHeader
            title={'Tutor Details'}
            description={`Please enter the details for the new ${userRole}. The Tutor will get a email with their credentials to sign in.`}
          />
        
          <SectionBody className={'space-y-4'}>
            <TextFieldLabel className='flex flex-col items-start justify-start'>
              Email Address
              <TextFieldInput
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                required
              />
            </TextFieldLabel>
          </SectionBody>
        </Section>
      </ModalComponent>
    </div>
  );
}
