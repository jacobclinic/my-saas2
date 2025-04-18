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
import { joinMeetingAsUser } from '~/lib/zoom/server-actions-v2';
import useUserSession from '~/core/hooks/use-user-session';
import StudentSessionCard from './StudentSessionCard';
import StudentNextSessionCard from './StudentNextSessionCard';
import { PaymentStatus } from '~/lib/payments/types/admin-payments';
import PaginationControls from '../../components/PaginationControls';

const StudentDashboard = ({
  upcomingSessionData,
  studentId,
}: {
  upcomingSessionData: UpcomingSession[];
  studentId: string;
}) => {
  const userSession = useUserSession();
  const [isPending, startTransition] = useTransition();
  const [nextSession, setNextSession] =
    useState<SessionStudentTableData | null>(null);
  const [upcomingSessions, setUpcomingSessions] = useState<
    SessionStudentTableData[]
  >([]);

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

  // Sample data
  const nextSessionsSampleData = {
    id: '1',
    name: 'A/L 2025 Accounting Batch 04',
    topic: 'Manufacturing Accounts - Part 1',
    date: 'Monday, Dec 18, 2024',
    time: '4:00 PM - 6:00 PM',
    zoomLink: 'https://zoom.us/j/123456789',
    paymentStatus: PaymentStatus.PENDING,
    paymentAmount: 5000,
    zoomMeetingId: '123456789',
    materials: [
      {
        id: '1',
        name: 'Manufacturing Accounts Notes.pdf',
        file_size: '2.5 MB',
      },
      { id: '2', name: 'Practice Problems Set.pdf', file_size: '1.8 MB' },
    ],
  };

  const upcomingSessionsSampleData = useMemo(
    () => [
      {
        id: '2',
        created_at: new Date().toISOString(),
        class_id: '1',
        recording_urls: [],
        status: 'scheduled',
        start_time: '2024-12-25T16:00:00Z',
        end_time: '2024-12-25T18:00:00Z',
        title: 'Manufacturing Accounts - Part 2',
        description: '',
        updated_at: new Date().toISOString(),
        meeting_url: 'https://zoom.us/j/123456789',
        zoom_meeting_id: '123456789',
        payment_status: PaymentStatus.VERIFIED,
        payment_amount: 5000,
        class: {
          id: '1',
          name: 'A/L 2025 Accounting Batch 04',
          subject: 'Accounting',
          tutor_id: '1',
          fee: 5000,
        },
        materials: [
          {
            id: '3',
            name: 'Manufacturing Accounts Part 2.pdf',
            file_size: '3.0 MB',
            url: 'https://example.com/materials/3',
          },
        ],
        recurring_session_id: null,
      },
      {
        id: '4',
        created_at: new Date().toISOString(),
        class_id: '1',
        recording_urls: [],
        status: 'scheduled',
        start_time: '2025-01-01T16:00:00Z',
        end_time: '2025-01-01T18:00:00Z',
        title: 'Introduction to Partnership Accounts',
        description: '',
        updated_at: new Date().toISOString(),
        meeting_url: 'https://zoom.us/j/123456789',
        zoom_meeting_id: '123456789',
        payment_status: PaymentStatus.PENDING,
        payment_amount: 5000,
        class: {
          id: '1',
          name: 'A/L 2025 Accounting Batch 04',
          subject: 'Accounting',
          tutor_id: '1',
          fee: 5000,
        },
        materials: [
          {
            id: '5',
            name: 'Partnership Accounts Notes.pdf',
            file_size: '2.5 MB',
            url: 'https://example.com/materials/5',
          },
          {
            id: '6',
            name: 'Practice Problems Set.pdf',
            file_size: '1.8 MB',
            url: 'https://example.com/materials/6',
          },
        ],
        recurring_session_id: null,
      },
    ],
    [],
  );

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

  const joinMeetingAsStudent = useCallback(
    async (sessionData: any) => {
      startTransition(async () => {
        const result = await joinMeetingAsUser({
          meetingId: sessionData?.zoomMeetingId,
          studentData: {
            first_name: userSession?.data?.first_name || '',
            last_name: userSession?.data?.last_name || '',
            email: userSession?.auth?.user?.email || '',
          },
        });
        if (result.success) {
          window.open(result.start_url, '_blank');
        } else {
          alert('Failed to generate join link');
        }
      });
    },
    [userSession],
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
      <div className="max-w-4xl mx-auto space-y-6">
       

        {/* Next Session */}
        {nextSession && (
          <StudentNextSessionCard
            key={nextSession.id}
            sessionData={nextSession}
            isPending={isPending}
            setSelectedSession={setSelectedSession}
            setShowPaymentDialog={setShowPaymentDialog}
            joinMeetingAsStudent={joinMeetingAsStudent}
          />
        )}

        {/* Upcoming Sessions */}
        {upcomingSessions.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              <h2 className="text-xl font-bold">Upcoming Classes</h2>
            </div>
            {currentUpcomingSessions.map((sessionData) => (
              <StudentSessionCard
                key={sessionData.id}
                sessionData={sessionData}
                type="upcoming"
                isPending={isPending}
                setSelectedSession={setSelectedSession}
                setShowPaymentDialog={setShowPaymentDialog}
                joinMeetingAsStudent={joinMeetingAsStudent}
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
