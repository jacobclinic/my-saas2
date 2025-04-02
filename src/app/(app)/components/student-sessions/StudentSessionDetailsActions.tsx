import { Button } from '../base-v2/ui/Button';
import { Alert, AlertDescription } from '../base-v2/ui/Alert';
import { DollarSign, Camera, Video, AlertTriangle } from 'lucide-react';
import { PAYMENT_STATUS } from '~/lib/student-payments/constant';
import { SessionStudentTableData } from '~/lib/sessions/types/upcoming-sessions';
import { ClassData } from '~/lib/classes/types/class-v2';
import { generateRegistrationLinkAction } from '~/app/actions/registration-link';

interface StudentSessionDetailsActionsProps {
  sessionData: SessionStudentTableData;
  type: 'upcoming' | 'past' | 'next';
  onPayment: () => void;
  isEnrolledToClass: boolean;
  classData: ClassData;
}

const StudentSessionDetailsActions = async ({
  sessionData,
  type,
  onPayment,
  isEnrolledToClass,
  classData,
}: StudentSessionDetailsActionsProps) => {
  if (type === 'past') {
    return (
      <div className="space-y-4">
        {sessionData.recordingUrl && (
          <Button
            className="w-full"
            onClick={() => window.open(sessionData.recordingUrl, '_blank')}
          >
            <Video className="h-4 w-4 mr-2" />
            Watch Recording
          </Button>
        )}
      </div>
    );
  }

  const registrationData = {
    classId: classData.id,
    className: classData.name || '',
    nextSession: classData.nextClass || classData.schedule || '',
    time: classData.schedule || '',
  };

  const registrationLink =
    await generateRegistrationLinkAction(registrationData);

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
        ) : (
          <Button className="w-full">
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
