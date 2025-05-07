'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { Input } from '../base-v2/ui/Input';
import { Textarea } from '../base-v2/ui/Textarea';
import { AlertTriangle, X, Upload, File, Plus, Trash } from 'lucide-react';
import { Alert, AlertDescription } from '../base-v2/ui/Alert';
import BaseDialog from '../base-v2/BaseDialog';
import useCsrfToken from '~/core/hooks/use-csrf-token';
import { Button } from '../base-v2/ui/Button';
import { updateSessionAction } from '~/lib/sessions/server-actions-v2';
import { useToast } from '../../lib/hooks/use-toast';

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

      // Set the date and time inputs based on the session data
      if (sessionData.startTime) {
        const startDate = new Date(sessionData.startTime);
        setSessionDate(startDate.toISOString().split('T')[0]);
        setSessionStartTime(
          startDate.toISOString().split('T')[1].substring(0, 5),
        );
      }

      if (sessionData.endTime) {
        const endDate = new Date(sessionData.endTime);
        setSessionEndTime(endDate.toISOString().split('T')[1].substring(0, 5));
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

  // Function to combine date and time into ISO format
  const combineDateAndTime = (date: string, time: string): string => {
    if (!date || !time) return '';

    // Create a proper ISO string with timezone information
    // First create a Date object with the combined date and time
    const combinedDateTime = new Date(`${date}T${time}:00`);

    // Return the ISO string
    return combinedDateTime.toISOString();
  };

  const handleSubmit = () => {
    // console.log('--------------sessionId--------', sessionId);
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

        // console.log('--------------updatedSession--------', updatedSession);

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

  const isValid = sessionDate && sessionStartTime && sessionEndTime;

  // // Original convertToIST function - keeping for reference but not using
  // const convertToIST = (utcTimeString: string) => {
  //   // Parse the UTC time
  //   const utcDate = new Date(utcTimeString);

  //   // Add 5 hours and 30 minutes
  //   const istTime = new Date(utcDate.getTime() + 5.5 * 60 * 60 * 1000);

  //   // Format the date to desired string
  //   const year = istTime.getUTCFullYear();
  //   const month = String(istTime.getUTCMonth() + 1).padStart(2, '0');
  //   const day = String(istTime.getUTCDate()).padStart(2, '0');
  //   const hours = String(istTime.getUTCHours()).padStart(2, '0');
  //   const minutes = String(istTime.getUTCMinutes()).padStart(2, '0');
  //   const seconds = String(istTime.getUTCSeconds()).padStart(2, '0');

  //   const istFormatedTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}+5:30`;
  //   // Get local ISO string
  //   const localISOString = new Date(istFormatedTime).toLocaleDateString();

  //   // Return the formatted string for datetime-local input
  //   return localISOString.slice(0, 16);
  // };

  return (
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
        </div>

        <div>
          <label className="text-sm font-medium">Session Date</label>
          <Input
            type="date"
            value={sessionDate}
            onChange={(e) => setSessionDate(e.target.value)}
          />
        </div>

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
  );
};

export default EditSessionDialog;
