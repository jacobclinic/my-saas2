'use client';

import { useCallback, useState } from 'react';
import useMutation from 'swr/mutation';
import { toast } from 'sonner';

import UserSession from '~/core/session/types/user-session';
import TextField from '~/core/ui/TextField';
import If from '~/core/ui/If';

import Button from '~/core/ui/Button';
import Modal from '~/core/ui/Modal';
import AuthErrorMessage from '~/app/auth/components/AuthErrorMessage';
import useSupabase from '~/core/hooks/use-supabase';
import { filterPhoneInput } from '~/core/utils/input-filters';

import configuration from '~/configuration';
import { validatePhoneNumber } from '~/core/utils/validate-phonenumber';

interface UpdatePhoneNumberFormProps {
  session: UserSession;
  onUpdate: (phoneNumber: Maybe<string>) => void;
}

function UpdatePhoneNumberForm({
  session,
  onUpdate,
}: UpdatePhoneNumberFormProps) {
  const { trigger, isMutating } = useUpdatePhoneNumber();
  const currentPhoneNumber = session.auth?.user?.phone ?? '';
  const [phoneError, setPhoneError] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const form = event.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const phoneNumber = formData.get('phoneNumber') as string;

    // Validate phone number
    const validation = validatePhoneNumber(phoneNumber);
    if (!validation.isValid) {
      setPhoneError(validation.message!);
      return;
    }

    setPhoneError('');

    const promise = trigger(phoneNumber).then(() => {
      onUpdate(phoneNumber);
    });

    return toast.promise(promise, {
      loading: `Updating phone number...`,
      success: `Phone number successfully updated`,
      error: `Sorry, we encountered an error while updating your phone number. Please try again`,
    });
  };

  return (
    <form onSubmit={handleSubmit} data-cy={'update-phone-number-form'}>
      <div className={'flex flex-col space-y-4'}>
        <TextField>
          <TextField.Label>
            Phone number
            <TextField.Input
              name={'phoneNumber'}
              defaultValue={currentPhoneNumber}
              onChange={(e) => {
                // Filter to only allow digits
                const target = e.target as HTMLInputElement;
                const filteredValue = filterPhoneInput(target.value);
                target.value = filteredValue;

                // Clear error on change
                if (phoneError) {
                  setPhoneError('');
                }
              }}
            />
          </TextField.Label>

          {phoneError && <TextField.Error error={phoneError} />}

          {/* Only show this if phone number is enabled */}
          <If condition={configuration.auth.providers.phoneNumber}>
            <div>
              <If condition={currentPhoneNumber}>
                <RemovePhoneNumberButton
                  onSuccess={() => {
                    onUpdate(undefined);
                  }}
                />
              </If>
            </div>
          </If>
        </TextField>

        <div>
          <Button loading={isMutating}>Update phone number</Button>
        </div>
      </div>
    </form>
  );
}

export default UpdatePhoneNumberForm;

function RemovePhoneNumberButton({
  onSuccess,
}: React.PropsWithChildren<{
  onSuccess: () => void;
}>) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { trigger, error, isMutating } = useUpdatePhoneNumber();

  const onUnlinkPhoneNumber = useCallback(() => {
    const promise = trigger('').then(() => {
      setIsModalOpen(false);
      onSuccess();
    });

    return toast.promise(promise, {
      loading: `Removing phone number...`,
      success: `Phone number successfully removed`,
      error: `Sorry, we encountered an error while removing your phone number. Please try again`,
    });
  }, [trigger, onSuccess]);

  return (
    <>
      <Button
        type={'button'}
        variant={'ghost'}
        size={'small'}
        onClick={() => setIsModalOpen(true)}
      >
        <span className={'text-xs font-normal'}>Remove Phone Number</span>
      </Button>

      <Modal
        heading={`Remove Phone Number`}
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
      >
        <div className={'flex flex-col space-y-2.5 text-sm'}>
          <div>
            You&apos;re about to remove your phone number. You will not be able
            to use it to login to your account.
          </div>

          <div>Do you want to continue?</div>

          <AuthErrorMessage error={error} />

          <div className={'flex justify-end space-x-2'}>
            <Modal.CancelButton onClick={() => setIsModalOpen(false)} />

            <Button
              type={'button'}
              loading={isMutating}
              variant={'destructive'}
              onClick={onUnlinkPhoneNumber}
            >
              Yes, remove phone number
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function useUpdatePhoneNumber() {
  const client = useSupabase();
  const key = 'useUpdatePhoneNumber';

  return useMutation(key, async (_, { arg: phone }: { arg: string }) => {
    return client.auth.updateUser({ phone }).then((response) => {
      if (response.error) {
        throw response.error;
      }

      return response.data;
    });
  });
}
