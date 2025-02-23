import { Button } from "../base-v2/ui/Button";
import { Alert, AlertDescription } from "../base-v2/ui/Alert";
import { 
  DollarSign, 
  Camera, 
  Video, 
  AlertTriangle 
} from 'lucide-react';
import { PAYMENT_STATUS } from '~/lib/student-payments/constant';
import { SessionStudentTableData } from "~/lib/sessions/types/upcoming-sessions";

interface StudentSessionDetailsActionsProps {
    sessionData: SessionStudentTableData;
    type: "upcoming" | "past" | "next";
    onPayment: () => void;
}

const StudentSessionDetailsActions = ({ sessionData, type, onPayment }: StudentSessionDetailsActionsProps) => {
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

  return (
    <div className="space-y-4">
      {sessionData.paymentStatus === PAYMENT_STATUS.PENDING ? (
        <>
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              Please complete the payment of Rs. {sessionData.paymentAmount} to access the class
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
      )}
    </div>
  );
};

export default StudentSessionDetailsActions;