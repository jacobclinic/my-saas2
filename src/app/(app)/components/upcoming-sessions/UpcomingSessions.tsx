'use client';

import React, { useEffect, useState } from 'react';
import type { UpcomingSessionTableData } from '~/lib/sessions/types/upcoming-sessions';
import { Alert, AlertDescription } from '../base-v2/ui/Alert';
import { Input } from '../base-v2/ui/Input';
import { Info, Search, X } from 'lucide-react';
import UpcommingSessionCard from './UpcommingSessionCard';
import { UpcomingSession } from '~/lib/sessions/types/session-v2';
import { DateRangePicker } from '@heroui/date-picker';
import {
  formatDateTimeRange,
  getUserTimezone,
} from '~/lib/utils/timezone-utils';
import {
  datePickerObjectToLocalDate,
  utcToLocalDate,
} from '~/lib/utils/timezone-utils-filter';

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

const UpcomingSessions = ({
  upcomingSessionData,
  onFilterChange,
  allSessionData,
}: {
  upcomingSessionData: UpcomingSession[];
  onFilterChange: (filteredData: UpcomingSession[]) => void;
  allSessionData: UpcomingSession[];
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [upcomingSessionTableData, setUpcomingSessionTableData] = useState<
    UpcomingSessionTableData[]
  >([]);

  // Format current page data for display
  useEffect(() => {
    if (upcomingSessionData) {
      const formattedData: UpcomingSessionTableData[] = upcomingSessionData.map(
        (session) => formatSessionData(session),
      );
      setUpcomingSessionTableData(formattedData);
    }
  }, [upcomingSessionData]);
  // Helper function to format session data
  const formatSessionData = (
    session: UpcomingSession,
  ): UpcomingSessionTableData => {
    // Format date and time using timezone utility to respect user's timezone
    const { formattedDate, formattedTime } = formatDateTimeRange(
      session?.start_time,
      session?.end_time,
      'EEEE, MMMM d, yyyy',
      'h:mm a',
    );

    return {
      id: session.id,
      name: `${session?.class?.name}`,
      subject: session?.class?.subject || '',
      date: formattedDate,
      time: formattedTime,
      start_time: session.start_time || '',
      end_time: session.end_time || '',
      registeredStudents: session?.class?.students?.length || 0,
      zoomMeetingId: session?.zoom_meeting_id || '',
      zoomLinkTutor: session?.meeting_url || '',
      zoomLinkStudent: session?.meeting_url || '',
      materials: session?.materials?.map((material) => {
        return {
          id: material.id,
          name: material.name || '',
          url: material.url || '',
          file_size: material.file_size || '',
        };
      }),
      lessonTitle: session?.title || '',
      lessonDescription: session?.description || '',
      sessionRawData: session,
    };
  };

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
          // Convert to user's local time zone for comparison
          const userTimezone = getUserTimezone();
          const sessionStartInUserTZ = utcToLocalDate(
            sessionStartUtc,
            userTimezone,
          );
          const sessionEndInUserTZ = utcToLocalDate(
            sessionEndUtc,
            userTimezone,
          );
          const startDateInUserTZ = utcToLocalDate(startDate, userTimezone);
          const endDateInUserTZ = utcToLocalDate(endDate, userTimezone);

          matchesDateRange = 
            !!sessionStartInUserTZ && !!startDateInUserTZ && !!sessionEndInUserTZ && !!endDateInUserTZ &&
            sessionStartInUserTZ >= startDateInUserTZ &&
            sessionEndInUserTZ <= endDateInUserTZ;
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
    <div className="xl:min-w-[900px] space-y-6">
      {' '}
      {/* Header & Search */}
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
          <div>
            <button
              hidden={!dateRange}
              onClick={() => setDateRange(null)}
              className="text-sm border border-gray-300 rounded-md px-3 py-2.5"
              aria-label="Clear date filter"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
      {/* Classes List */}
      <div className="space-y-6">
        {upcomingSessionTableData.length > 0 ? (
          upcomingSessionTableData.map((sessionData) => (
            <UpcommingSessionCard
              key={sessionData.id}
              sessionData={sessionData}
            />
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            No upcoming classes match your search criteria.
          </div>
        )}
      </div>
    </div>
  );
};

export default UpcomingSessions;
