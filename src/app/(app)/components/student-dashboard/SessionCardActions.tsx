'use client';

import { useRouter } from 'next/navigation';
import { Button } from '~/app/(app)/components/base-v2/ui/Button';
import { Banknote, ExternalLink, FileText } from 'lucide-react';
import { SessionStudentTableData } from '~/lib/sessions/types/upcoming-sessions';
import { PAYMENT_STATUS } from '~/lib/student-payments/constant';
import { isFirstWeekOfMonth } from '~/lib/utils/date-utils';
import useSessionTimeValidation from '~/core/hooks/use-session-time-validation';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/app/(app)/components/base-v2/ui/tooltip';

interface SessionCardActionsProps {
  sessionData: SessionStudentTableData;
  isPending: boolean;
  setSelectedSession: (session: SessionStudentTableData) => void;
  setShowPaymentDialog: (show: boolean) => void;
  joinMeetingAsStudent: (sessionData: any) => void;
}

const SessionCardActions = ({
  sessionData,
  isPending,
  setSelectedSession,
  setShowPaymentDialog,
  joinMeetingAsStudent,
}: SessionCardActionsProps) => {
  const router = useRouter();
  const isWithinJoinWindow = useSessionTimeValidation(
    sessionData.sessionRawData?.start_time || ''
  );

  const onPayNow = () => {
    setSelectedSession(sessionData);
    setShowPaymentDialog(true);
  };

  const onJoinMeeting = () => joinMeetingAsStudent(sessionData);

  const onViewClass = () =>
    router.push(`/sessions/student/${sessionData.id}?type=next`);

  const renderPrimaryAction = () => {
    const isFreeFirstWeek = isFirstWeekOfMonth(sessionData.date);
    const isPaymentPending =
      sessionData.paymentStatus === PAYMENT_STATUS.PENDING;
    const isPaymentPaid =
      sessionData.paymentStatus !== PAYMENT_STATUS.PENDING &&
      sessionData.paymentStatus !== PAYMENT_STATUS.PENDING_VERIFICATION;

    if (isFreeFirstWeek || isPaymentPaid) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-full flex-1">
                <Button
                  variant={'primary'}
                  className="w-full"
                  onClick={onJoinMeeting}
                  disabled={isPending || !isWithinJoinWindow}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Join Class
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {!isWithinJoinWindow ? (
                <p>Will be available 1 hour before class starts</p>
              ) : (
                <p>Join the class</p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    if (isPaymentPending) {
      return (
        <Button
          variant={'primary'}
          className="w-[118px] text-sm font-medium"
          onClick={onPayNow}
        >
          <Banknote className="h-4 w-4 mr-2" />
          Pay Now
        </Button>
      );
    }

    return null;
  };

  return (
    <div className="flex justify-between gap-2 w-full">
      {renderPrimaryAction()}
      <Button
        variant="outline"
        className="w-full flex-1 gap-1"
        onClick={onViewClass}
      >
        <FileText size={16} />
        View Class
      </Button>
    </div>
  );
};

export default SessionCardActions;
