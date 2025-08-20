'use client';

import React, { useCallback, useEffect, useState, useTransition } from 'react';
import type {
  SessionStudentTableData,
} from '~/lib/sessions/types/upcoming-sessions';
import { Input } from '../base-v2/ui/Input';
import { Search } from 'lucide-react';
import { PastSession, UpcomingSession } from '~/lib/sessions/types/session-v2';
import { DateRangePicker } from '@heroui/date-picker';
import StudentSessionCard from '../student-dashboard/StudentSessionCard';
import { PaymentStatus } from '~/lib/payments/types/admin-payments';
import useUserSession from '~/core/hooks/use-user-session';
import PaymentDialog from '../student-payments/PaymentDialog';
import {
  formatDateTimeRange,
} from '~/lib/utils/timezone-utils';
import {
  datePickerObjectToLocalDate,
} from '~/lib/utils/timezone-utils-filter';
import { useRouter } from 'next/navigation';
import { TooltipProvider } from '~/app/(app)/components/base-v2/ui/tooltip';

interface DateRange {
  start?: {
    year: number;
    month: number;
    day: number;
  } | null;
  end?: {
    year: number;
    month: number;
    day: number;
  } | null;
}

const StudentUpcomingSessions = ({
  upcomingSessionData,
  onFilterChange,
  allSessionData,
  userId,
}: {
  upcomingSessionData: UpcomingSession[];
  onFilterChange: (filteredData: UpcomingSession[]) => void;
  allSessionData: UpcomingSession[];
  userId: string;
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const userSession = useUserSession();
  const [isAlertVisible, setIsAlertVisible] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  const [upcomingSessions, setUpcomingSessions] = useState<
    SessionStudentTableData[]
  >([]);

  const [selectedSession, setSelectedSession] =
    useState<SessionStudentTableData | null>(null);

  const [isPending, startTransition] = useTransition();

  const router = useRouter();

  // Transform upcoming sessions data
  useEffect(() => {
    if (upcomingSessionData?.length > 0) {
      const UpcomingSessionData = upcomingSessionData.map(formatSessionData);
      setUpcomingSessions(UpcomingSessionData);
    } else {
      // Reset if there's no data
      setUpcomingSessions([]);
    }
  }, [upcomingSessionData]);
  // Helper function to format session data
  const formatSessionData = (
    sessionData: UpcomingSession | PastSession,
  ): SessionStudentTableData => {
    // Format date and time using timezone utility to respect user's timezone
    const { formattedDate, formattedTime } = formatDateTimeRange(
      sessionData.start_time,
      sessionData.end_time,
      'EEEE, MMMM d, yyyy',
      'h:mm a',
    );

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
      recordingUrl: sessionData?.recording_urls || [],
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
      // startTransition(async () => {
      //   const result = await joinMeetingAsUser({
      //     meetingId: sessionData?.zoomMeetingId,
      //     studentData: {
      //       first_name: userSession?.data?.first_name || '',
      //       last_name: userSession?.data?.last_name || '',
      //       email: userSession?.auth?.user?.email || '',
      //     },
      //   });
      //   if (result.success) {
      //     window.open(result.start_url, '_blank');
      //   } else {
      //     alert('Failed to generate join link');
      //   }
      // });
      startTransition(() => {
        if (sessionData.sessionRawData && sessionData.sessionRawData.class && sessionData.sessionRawData.class.id) {
          const classId = sessionData.sessionRawData.class.id;
          const url = `/classes/${classId}/session/${sessionData.id}`;
          router.push(url);
        }
      });
    },
    [userSession],
  );
  // Filter the complete dataset when search or date range changes
  useEffect(() => {
    // Apply filters to the FULL dataset
    const filteredSessions = allSessionData.filter((session) => {
      // Apply search term filter
      const matchesSearchTerm = searchTerm
        ? (session?.class?.name || '')
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
        : true;

      // Apply date range filter if dateRange is selected
      let matchesDateRange = true;

      if (dateRange && dateRange.start && dateRange.end) {
        const sessionStartUtc = new Date(session?.start_time || '');
        const sessionEndUtc = new Date(session?.end_time || '');
        const startDate = datePickerObjectToLocalDate(dateRange.start);
        const endDate = datePickerObjectToLocalDate(dateRange.end, true); // Pass true to set end date to 11:59 PM

        if (startDate && endDate) {
          matchesDateRange =
            sessionStartUtc >= startDate && sessionEndUtc <= endDate;
        }
      }

      // Return true only if both conditions are satisfied
      return matchesSearchTerm && matchesDateRange;
    });

    // Call the parent's onFilterChange with the filtered data
    onFilterChange(filteredSessions);
  }, [searchTerm, dateRange, allSessionData]);

  // Handle date range change
  const handleDateRangeChange = (value: any) => {
    setDateRange(value);
  };

  return (
    <TooltipProvider>
      <div className="xl:min-w-[900px] space-y-6">
      {/* Header & Search */}{' '}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search by class name..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* HeroUI DateRangePicker */}
          <DateRangePicker
            value={dateRange as any}
            aria-label="Date Range"
            onChange={handleDateRangeChange}
            className="w-full sm:w-auto border rounded-lg border-gray-300"
          />
        </div>
      </div>
      {/* Upcoming Sessions */}
      {upcomingSessions.length > 0 && (
        <div className="space-y-4">
          {upcomingSessions.map((sessionData) => (
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

          {showPaymentDialog && selectedSession && (
            <PaymentDialog
              open={showPaymentDialog}
              onClose={() => setShowPaymentDialog(false)}
              sessionData={selectedSession}
              studentId={userId}
            />
          )}
        </div>
      )}
      </div>
    </TooltipProvider>
  );
};

export default StudentUpcomingSessions;
