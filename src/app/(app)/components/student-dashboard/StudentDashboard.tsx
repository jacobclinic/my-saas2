'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from 'react';
import { Calendar, Info, MonitorPlay } from 'lucide-react';
import { UpcomingSession } from '~/lib/sessions/types/session-v2';
import { SessionStudentTableData } from '~/lib/sessions/types/upcoming-sessions';
import PaymentDialog from '../student-payments/PaymentDialog';
import useUserSession from '~/core/hooks/use-user-session';
import StudentSessionCard from './StudentSessionCard';
import StudentNextSessionCard from './StudentNextSessionCard';
import { PaymentStatus } from '~/lib/payments/types/admin-payments';
import PaginationControls from '../../components/PaginationControls';
import { useRouter } from 'next/navigation';
import { secureJoinSessionAction } from '~/lib/sessions/server-actions-v2';
import useCsrfToken from '~/core/hooks/use-csrf-token';
import { toast } from 'sonner';
import { ErrorCodes } from '~/lib/shared/error-codes';

const StudentDashboard = ({
  upcomingSessionData,
  studentId,
}: {
  upcomingSessionData: UpcomingSession[];
  studentId: string;
}) => {
  const userSession = useUserSession();
  const [isPending, startTransition] = useTransition();
  const csrfToken = useCsrfToken();
  const [nextSession, setNextSession] =
    useState<SessionStudentTableData | null>(null);
  const [upcomingSessions, setUpcomingSessions] = useState<
    SessionStudentTableData[]
  >([]);

  const router = useRouter();

  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedSession, setSelectedSession] =
    useState<SessionStudentTableData | null>(null);

  // Pagination state
  const [upcomingCurrentPage, setUpcomingCurrentPage] = useState(1);
  const itemsPerPage = 3; // Items per page

  const handleUpcomingPageChange = (page: number) => {
    // console.log('Upcoming Page Changed:', page);
    setUpcomingCurrentPage(page);
  };

  // Transform upcoming sessions data
  useEffect(() => {
    if (upcomingSessionData?.length > 0) {
      const nextSessionData = upcomingSessionData[0];
      const formattedNextSession = formatSessionData(nextSessionData);
      setNextSession(formattedNextSession);

      const remainingUpcoming = upcomingSessionData
        .slice(1)
        .map(formatSessionData);
      setUpcomingSessions(remainingUpcoming);
    } else {
      // Reset if there's no data
      setNextSession(null);
      setUpcomingSessions([]);
    }
  }, [upcomingSessionData]);

  // Helper function to format session data
  const formatSessionData = (
    sessionData: UpcomingSession,
  ): SessionStudentTableData => {
    const formattedDate = new Date(
      sessionData.start_time || '',
    ).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const formattedTime = `${new Date(
      sessionData.start_time || '',
    ).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    })} - ${new Date(
      sessionData.end_time || sessionData.start_time || '',
    ).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    })}`;

    return {
      id: sessionData.id,
      name: sessionData.class?.name || '',
      topic: sessionData.title,
      date: formattedDate,
      time: formattedTime,
      paymentStatus:
        (sessionData.payment_status as PaymentStatus) || PaymentStatus.PENDING,
      paymentAmount:
        Number(sessionData.payment_amount) || sessionData.class?.fee || 0,
      paymentDueDate: sessionData.payment_due_date || undefined,
      zoomLink: sessionData.meeting_url || undefined,
      zoomMeetingId: sessionData.zoom_meeting_id || '',
      recordingUrl: sessionData.recording_urls || [],
      materials:
        sessionData.materials?.map((material) => ({
          id: material.id,
          name: material.name,
          file_size: material.file_size,
          url: material.url,
        })) || [],
      classId: sessionData.class?.id,
      sessionRawData: sessionData,
    };
  };

  const joinMeetingAsStudentUser = useCallback(
    async (sessionData: any) => {
      startTransition(async () => {
        try {
          const result = await secureJoinSessionAction({
            sessionId: sessionData.id,
            csrfToken,
          });

          if (result.success && result.joinUrl) {
            window.open(result.joinUrl, '_blank');
            toast.success('Opening secure meeting link...');
          } else {
            let errorMessage = result.error || 'Failed to generate join link';

            switch (result.errorCode) {
              case ErrorCodes.FORBIDDEN:
                errorMessage = result.error || 'Access denied. Please check your payment status.';
                break;
              case ErrorCodes.RESOURCE_NOT_FOUND:
                errorMessage = result.error || 'Meeting not found. Please try again later.';
                break;
              case ErrorCodes.UNAUTHORIZED:
                errorMessage = 'Please sign in to join the class.';
                break;
              default:
                errorMessage = result.error || 'Unable to join class. Please try again.';
            }

            toast.error(errorMessage);
          }
        } catch (error) {
          console.error('Error joining class:', error);
          toast.error('An unexpected error occurred. Please try again.');
        }
      });
    },
    [csrfToken],
  );

  // Calculate paginated data
  const indexOfLastUpcoming = upcomingCurrentPage * itemsPerPage;
  const indexOfFirstUpcoming = indexOfLastUpcoming - itemsPerPage;
  const currentUpcomingSessions = upcomingSessions.slice(
    indexOfFirstUpcoming,
    indexOfLastUpcoming,
  );

  const totalPagesOfUpcmingSessions = Math.ceil(
    upcomingSessions.length / itemsPerPage,
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
     

      {/* Next Session */}
      <div className='lg:col-span-1 order-1'>
        <h2 className="text-lg font-semibold text-gray-900 p-4">Your Next Class</h2>
        <div className='p-4'>
          {nextSession && (
            <StudentNextSessionCard
              key={nextSession.id}
              sessionData={nextSession}
              isPending={isPending}
              setSelectedSession={setSelectedSession}
              setShowPaymentDialog={setShowPaymentDialog}
              joinMeetingAsStudent={joinMeetingAsStudentUser}
            />
          )}
        </div>
      </div>

      {/* Upcoming Sessions */}
      {upcomingSessions.length > 0 && (
        <div className="lg:col-span-2 order-2 bg-white rounded-lg border border-gray-200 bg-gradient-to-br from-blue-50 to-blue-100 border-none shadow-lg">
          <div className="flex items-center p-4">
            <h2 className="text-lg font-semibold text-gray-900">Your Upcoming Classes</h2>
          </div>
          <div className='p-4'>
            {currentUpcomingSessions.map((sessionData) => (
              <StudentSessionCard
                key={sessionData.id}
                sessionData={sessionData}
                type="upcoming"
                isPending={isPending}
                setSelectedSession={setSelectedSession}
                setShowPaymentDialog={setShowPaymentDialog}
                joinMeetingAsStudent={joinMeetingAsStudentUser}
              />
            ))}
            {/* Pagination Controls for Upcoming Sessions */}
            {totalPagesOfUpcmingSessions > 1 && (
              <PaginationControls
                currentPage={upcomingCurrentPage}
                totalPages={totalPagesOfUpcmingSessions}
                onPageChange={handleUpcomingPageChange}
              />
            )}

          </div>
        </div>
      )}
      {showPaymentDialog && selectedSession && (
        <PaymentDialog
          open={showPaymentDialog}
          onClose={() => setShowPaymentDialog(false)}
          sessionData={selectedSession}
          studentId={studentId}
        />
      )}
      </div>
    </div>
  );
};

export default StudentDashboard;
