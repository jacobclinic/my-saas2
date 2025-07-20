'use client';

import { useCallback, useState, useTransition } from 'react';
import ModalComponent from './ModalComponent';
import { TextFieldInput, TextFieldLabel } from '~/core/ui/TextField';
import { Section, SectionBody, SectionHeader } from '~/core/ui/Section';
import UserType from '~/lib/user/types/user';
import useCsrfToken from '~/core/hooks/use-csrf-token';
import { createUserByAdminAction } from '~/lib/user/actions.server';

interface CreateUserModalProps {
  userRole: string;
}

export default function CreateUserModal({ 
  userRole, 
}: CreateUserModalProps) {
  const userRoleCapitalized = userRole.charAt(0).toUpperCase() + userRole.slice(1);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  
  const [isMutating, startTransition] = useTransition();
  const csrfToken = useCsrfToken();

  const resetToDefaultValues = () => {
    setEmail('');
    setFirstName('');
    setLastName('');
  }

  const handleCreateClass = useCallback(async () => {
    const newUser: Omit<UserType, 'id'>  = {
      email,
      first_name: firstName,
      last_name: lastName,
      user_role: userRole,
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
  }, [csrfToken, email, firstName, lastName, userRole])
 
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
            title={`${userRoleCapitalized} Details`}
            description={`Please enter the details for the new ${userRole}. They will receive an email with their credentials to sign in.`}
          />
        
          <SectionBody className={'space-y-4'}>
            <div className="grid grid-cols-2 gap-4">
              <TextFieldLabel className='flex flex-col items-start justify-start'>
                First Name
                <TextFieldInput
                  type="text"
                  placeholder="Enter first name"
                  value={firstName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value)}
                  required
                />
              </TextFieldLabel>

              <TextFieldLabel className='flex flex-col items-start justify-start'>
                Last Name
                <TextFieldInput
                  type="text"
                  placeholder="Enter last name"
                  value={lastName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLastName(e.target.value)}
                  required
                />
              </TextFieldLabel>
            </div>

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
