'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { Input } from '../base-v2/ui/Input';
import { Textarea } from '../base-v2/ui/Textarea';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '../base-v2/ui/Alert';
import BaseDialog from '../base-v2/BaseDialog';
import useCsrfToken from '~/core/hooks/use-csrf-token';
import { Button } from '../base-v2/ui/Button';
import { updateSessionAction } from '~/lib/sessions/server-actions-v2';
import { useToast } from '../../lib/hooks/use-toast';
import { convertToLocalTime } from '~/lib/utils/timezone-utils';
import TimezoneIndicator from '../TimezoneIndicator';

interface Material {
  id: string;
  name: string | null;
  url?: string | null;
  file_size: string | null;
}

interface EditSessionData {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  materials: Material[];
  meetingUrl?: string;
}

interface EditSessionDialogProps {
  open: boolean;
  onClose: () => void;
  sessionId: string;
  sessionData: EditSessionData;
  loading?: boolean;
}

const EditSessionDialog: React.FC<EditSessionDialogProps> = ({
  open,
  onClose,
  sessionId,
  sessionData,
  loading = false,
}) => {
  const [isPending, startTransition] = useTransition();
  const csrfToken = useCsrfToken();
  const { toast } = useToast();

  const [editedSession, setEditedSession] = useState<EditSessionData>({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    materials: [],
    meetingUrl: '',
  });

  // Add state for separate date, startTime, and endTime inputs
  const [sessionDate, setSessionDate] = useState('');
  const [sessionStartTime, setSessionStartTime] = useState('');
  const [sessionEndTime, setSessionEndTime] = useState('');
  const [hasChanged, setHasChanged] = useState(false);

  useEffect(() => {
    if (sessionData) {
      setEditedSession({
        title: sessionData.title || '',
        description: sessionData.description || '',
        startTime: sessionData.startTime || '',
        endTime: sessionData.endTime || '',
        materials: sessionData.materials || [],
        meetingUrl: sessionData.meetingUrl || '',
      });

      // Set the date and time inputs based on the session data, converted to local time
      if (sessionData.startTime) {
        // The sessionData.startTime should be UTC, convert to local timezone
        const localStartDate = convertToLocalTime(sessionData.startTime);
        if (localStartDate) {
          // Format the local date properly for input fields
          const year = localStartDate.getFullYear();
          const month = String(localStartDate.getMonth() + 1).padStart(2, '0');
          const day = String(localStartDate.getDate()).padStart(2, '0');
          const hours = String(localStartDate.getHours()).padStart(2, '0');
          const minutes = String(localStartDate.getMinutes()).padStart(2, '0');

          setSessionDate(`${year}-${month}-${day}`);
          setSessionStartTime(`${hours}:${minutes}`);
        }
      }

      if (sessionData.endTime) {
        // The sessionData.endTime should be UTC, convert to local timezone
        const localEndDate = convertToLocalTime(sessionData.endTime);
        if (localEndDate) {
          // Format the local time properly for input field
          const hours = String(localEndDate.getHours()).padStart(2, '0');
          const minutes = String(localEndDate.getMinutes()).padStart(2, '0');

          setSessionEndTime(`${hours}:${minutes}`);
        }
      }
    }
  }, [sessionData]);

  useEffect(() => {
    // Create ISO strings from the separated fields whenever they change
    if (sessionDate && sessionStartTime) {
      const combinedStartTime = combineDateAndTime(
        sessionDate,
        sessionStartTime,
      );
      if (combinedStartTime !== editedSession.startTime) {
        setEditedSession((prev) => ({
          ...prev,
          startTime: combinedStartTime,
        }));
      }
    }

    if (sessionDate && sessionEndTime) {
      const combinedEndTime = combineDateAndTime(sessionDate, sessionEndTime);
      if (combinedEndTime !== editedSession.endTime) {
        setEditedSession((prev) => ({
          ...prev,
          endTime: combinedEndTime,
        }));
      }
    }
  }, [sessionDate, sessionStartTime, sessionEndTime]);

  useEffect(() => {
    if (
      editedSession.title !== sessionData.title ||
      editedSession.description !== sessionData.description ||
      editedSession.startTime !== sessionData.startTime ||
      editedSession.endTime !== sessionData.endTime ||
      editedSession.materials.length !== sessionData.materials.length ||
      editedSession.meetingUrl !== sessionData.meetingUrl
    ) {
      setHasChanged(true);
    } else {
      setHasChanged(false);
    }
  }, [
    editedSession.title,
    editedSession.description,
    editedSession.startTime,
    editedSession.endTime,
    editedSession.materials.length,
    editedSession.meetingUrl,
    sessionData,
  ]);
  // Function to combine date and time into ISO format and convert to UTC
  const combineDateAndTime = (date: string, time: string): string => {
    if (!date || !time) return '';

    // Create a Date object with the combined date and time in local timezone
    const combinedDateTime = new Date(`${date}T${time}:00`);

    // Convert to UTC by using the ISO string representation
    return combinedDateTime.toISOString();
  };

  const handleSubmit = async () => {
    await updateSession();
    onClose();
  };

  const isValid = sessionDate && sessionStartTime && sessionEndTime;

  const updateSession = async () => {
    if (sessionId) {
      startTransition(async () => {
        // Combine date and times before sending to the server
        const combinedStartTime = combineDateAndTime(
          sessionDate,
          sessionStartTime,
        );
        const combinedEndTime = combineDateAndTime(sessionDate, sessionEndTime);

        // Update the editedSession with the combined date and time values
        const updatedSession = {
          ...editedSession,
          startTime: combinedStartTime,
          endTime: combinedEndTime,
        };

        const result = await updateSessionAction({
          sessionId,
          sessionData: updatedSession,
          csrfToken,
        });

        if (result.success) {
          onClose();
          toast({
            title: 'Success',
            description: result.warning
              ? 'Session updated with warning: ' + result.warning
              : 'Session edited successfully',
            variant: result.warning ? 'destructive' : 'success',
            duration: result.warning ? 8000 : 3000, // Longer duration for warnings
          });
        } else {
          toast({
            title: 'Error',
            description: result.error || 'Failed to edit session',
            variant: 'destructive',
          });
        }
      });
    }
  };

  return (
    <>
      <BaseDialog
        open={open}
        onClose={onClose}
        title="Edit Session"
        description="Update your session details"
        maxWidth="xl"
        onConfirm={handleSubmit}
        confirmButtonText="Save Changes"
        loading={loading}
        confirmButtonVariant={isValid ? 'default' : 'secondary'}
        confirmButtonDisabled={!hasChanged || !isValid}
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Session Title</label>
            <Input
              placeholder="Enter session title"
              value={editedSession.title}
              onChange={(e) =>
                setEditedSession({ ...editedSession, title: e.target.value })
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea
              placeholder="Describe what will be covered in this session..."
              value={editedSession.description}
              onChange={(e) =>
                setEditedSession({
                  ...editedSession,
                  description: e.target.value,
                })
              }
              className="h-24"
            />
          </div>{' '}
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium">Session Date</label>
            <TimezoneIndicator showIcon={false} className="text-xs" />
          </div>
          <Input
            type="date"
            value={sessionDate}
            onChange={(e) => setSessionDate(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Start Time</label>
              <Input
                type="time"
                value={sessionStartTime}
                onChange={(e) => setSessionStartTime(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">End Time</label>
              <Input
                type="time"
                value={sessionEndTime}
                onChange={(e) => setSessionEndTime(e.target.value)}
              />
            </div>
          </div>
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-700">
              Changes to the session details will affect all enrolled students.
              Make sure to notify them of any changes.
            </AlertDescription>
          </Alert>
        </div>
      </BaseDialog>
    </>
  );
};

export default EditSessionDialog;
