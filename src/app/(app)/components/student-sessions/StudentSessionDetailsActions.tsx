'use client';
import { Button } from '../base-v2/ui/Button';
import { Alert, AlertDescription } from '../base-v2/ui/Alert';
import { DollarSign, Camera, Video, AlertTriangle } from 'lucide-react';
import { PAYMENT_STATUS } from '~/lib/student-payments/constant';
import { SessionStudentTableData } from '~/lib/sessions/types/upcoming-sessions';
import { ClassData } from '~/lib/classes/types/class-v2';
import { generateRegistrationLinkAction } from '~/app/actions/registration-link';
import { useCallback, useEffect, useState } from 'react';

interface StudentSessionDetailsActionsProps {
  sessionData: SessionStudentTableData;
  type: 'upcoming' | 'past' | 'next';
  onPayment: () => void;
  isEnrolledToClass: boolean;
  classData: ClassData;
}

const StudentSessionDetailsActions = ({
  sessionData,
  type,
  onPayment,
  isEnrolledToClass,
  classData,
}: StudentSessionDetailsActionsProps) => {
  const [registrationLink, setRegistrationLink] = useState('');
  useEffect(() => {
    const fetchRegistrationLink = async () => {
      const registrationData = {
        classId: classData.id,
        className: classData.name || '',
        nextSession: classData.nextClass || classData.schedule || '',
        time: classData.schedule || '',
      };
      const link = await generateRegistrationLinkAction(registrationData);
      setRegistrationLink(link);
    };

    if (type === 'upcoming') {
      fetchRegistrationLink();
    }
  }, [classData, type]);

    const getRecordingUrl = useCallback(async (fileName: string): Promise<string> => {
      console.log('Fetching signed URL for:', fileName);
      const response = await fetch(`/api/signed-url?fileName=${encodeURIComponent(fileName)}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch signed URL: ${response.statusText}`);
      }
      const data = await response.json();
      return data.signedUrl;
    }, []);

  if (type === 'past') {
    return (
      <div className="space-y-4">
        {sessionData.recordingUrl && sessionData.recordingUrl.length > 0 ? (
          sessionData.recordingUrl.map((fileName, index) => (
            <Button
              key={index}
              onClick={async () =>
                window.open(await getRecordingUrl(fileName), '_blank')
              }
              className="flex items-center"
            >
              <Video className="h-4 w-4 mr-2" />
              Watch Recording {index + 1}
            </Button>
          ))
        ) : (
          <p>No recordings available</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isEnrolledToClass ? (
        sessionData.paymentStatus === PAYMENT_STATUS.PENDING ? (
          <>
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                Please complete the payment of Rs. {sessionData.paymentAmount}{' '}
                to access the class
              </AlertDescription>
            </Alert>
            <Button
              className="w-full bg-red-600 hover:bg-red-700"
              onClick={onPayment}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Make Payment
            </Button>
          </>
        ) : sessionData.paymentStatus ===
          PAYMENT_STATUS.PENDING_VERIFICATION ? (
          <>
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-700">
                Your payment is under verification. Please wait for the
                confirmation.
              </AlertDescription>
            </Alert>
          </>
        ) : (
          <Button
            className="w-full"
            onClick={() => window.open(sessionData.zoomLink, '_blank')}
          >
            <Camera className="h-4 w-4 mr-2" />
            Join Class
          </Button>
        )
      ) : (
        <>
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              You are not enrolled in this class. Please enroll to join the
              session.
            </AlertDescription>
          </Alert>
          {/* Button to open registration link */}
          <Button
            className="w-full bg-red-600 hover:bg-red-700"
            onClick={() => window.open(registrationLink, '_blank')}
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Enroll Now
          </Button>
        </>
      )}
    </div>
  );
};

export default StudentSessionDetailsActions;
