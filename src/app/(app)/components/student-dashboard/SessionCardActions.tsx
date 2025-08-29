'use client';

import { useRouter } from 'next/navigation';
import { Button } from '~/app/(app)/components/base-v2/ui/Button';
import { Banknote, ExternalLink, FileText } from 'lucide-react';
import { SessionStudentTableData } from '~/lib/sessions/types/upcoming-sessions';
import { PAYMENT_STATUS } from '~/lib/student-payments/constant';
import { PaymentStatus } from '~/lib/payments/types/admin-payments';
import { isFirstWeekOfMonth } from '~/lib/utils/date-utils';
import useSessionTimeValidation from '~/core/hooks/use-session-time-validation';
import { MobileTooltip } from '~/app/(app)/components/base-v2/ui/mobile-tooltip';

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

  const isPaymentRequired = () => {
    return [
      PaymentStatus.PENDING,
      PaymentStatus.PENDING_VERIFICATION,
      PaymentStatus.REJECTED,
      PaymentStatus.NOT_PAID
    ].includes(sessionData.paymentStatus);
  };

  const renderPrimaryAction = () => {
    const isFreeFirstWeek = isFirstWeekOfMonth(sessionData.date);
    const isPaymentPending =
      sessionData.paymentStatus === PAYMENT_STATUS.PENDING;
    const isPaymentPaid =
      sessionData.paymentStatus !== PAYMENT_STATUS.PENDING &&
      sessionData.paymentStatus !== PAYMENT_STATUS.PENDING_VERIFICATION;

    if (isFreeFirstWeek || isPaymentPaid) {
      const isDisabled = isPending || !isWithinJoinWindow;
      return (
        <div className="w-full flex-1">
          <MobileTooltip
            content={
              !isWithinJoinWindow ? (
                <p>Will be available 1 hour before class starts</p>
              ) : (
                <p>Join the class</p>
              )
            }
            forceTouch={isDisabled} // Force touch handling for disabled buttons
          >
            <Button
              variant={'primary'}
              className="w-full"
              onClick={isDisabled ? undefined : onJoinMeeting}
              disabled={isDisabled}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Join Class
            </Button>
          </MobileTooltip>
        </div>
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

  const isViewDisabled = isPaymentRequired();
  
  return (
    <div className="flex gap-2 w-full">
      {renderPrimaryAction()}
      <div className="flex-1">
        <MobileTooltip
          content={
            isViewDisabled ? (
              <p>Payment required to view class details</p>
            ) : (
              <p>View class details and materials</p>
            )
          }
          forceTouch={isViewDisabled} // Force touch handling for disabled buttons
        >
          <Button
            variant="outline"
            className="w-full gap-1"
            onClick={isViewDisabled ? undefined : onViewClass}
            disabled={isViewDisabled}
          >
            <FileText size={16} />
            View Class
          </Button>
        </MobileTooltip>
      </div>
    </div>
  );
};

export default SessionCardActions;
