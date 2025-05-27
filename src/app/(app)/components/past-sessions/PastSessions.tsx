'use client';

import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '../base-v2/ui/Alert';
import { Input } from '../base-v2/ui/Input';
import { Info, Search, X } from 'lucide-react';
import PastSessionCard from './PastSessionCard';
import { PastSession } from '~/lib/sessions/types/session-v2';
import { DateRangePicker } from '@heroui/date-picker';
import { formatDateTimeRange } from '~/lib/utils/timezone-utils';
import TimezoneIndicator from '../TimezoneIndicator';
import { PastSessionData } from '~/lib/sessions/types/past-sessions';

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

const PastSessions = ({
  pastSessionsData,
  onFilterChange,
  allSessionData,
}: {
  pastSessionsData: PastSession[];
  onFilterChange: (filteredData: PastSession[]) => void;
  allSessionData: PastSession[];
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAlertVisible, setIsAlertVisible] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | null>(null); // Default range is null

  const [pastSessionTableData, setPastSessionTableData] = useState<
    PastSessionData[]
  >([]);

  useEffect(() => {
    if (pastSessionsData) {
      const formattedData: PastSessionData[] = pastSessionsData.map(
        (session) => formatSessionData(session),
      );
      setPastSessionTableData(formattedData);
    }
  }, [pastSessionsData]);
  const formatSessionData = (session: PastSession): PastSessionData => {
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
      topic: session?.title || '',
      zoom_meeting_id: session.zoom_meeting_id!,
      classId: session.class_id!,
      tutorId: session?.class?.tutor_id! || '',
      date: formattedDate,
      time: formattedTime,
      recordingUrl: session?.recording_urls || [],
      attendance_marked: session.attendance_marked!,
      attendance: session.attendance?.map((record) => {
        return {
          time: record.time || '',
          name: record.name || '',
          join_time: record.join_time || '',
          leave_time: record.leave_time || '',
          email: record.email || '',
        };
      }),
      materials: (session.materials || []).map((material) => {
        return {
          id: material.id,
          name: material.name || '',
          url: material.url || '',
          file_size: material.file_size || '',
        };
      }),
      noOfStudents: session.class?.students?.length || 0,
    };
  };

  const handleDateRangeChange = (value: any) => {
    setDateRange(value);
  };

  const dateObjectToDate = (
    dateObj: any,
    isEndDate: boolean = false,
  ): Date | null => {
    if (!dateObj) return null;
    const date = new Date(dateObj.year, dateObj.month - 1, dateObj.day);

    // If it's an end date, set time to 11:59:59 PM
    if (isEndDate) {
      date.setHours(23, 59, 59, 999);
    }

    return date;
  };

  useEffect(() => {
    // Apply filters to the FULL dataset
    const filteredSessions = allSessionData.filter((session) => {
      // Apply search term filter
      const matchesSearchTerm = searchQuery
        ? (session?.class?.name || '')
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
        : true;

      // Apply date range filter if dateRange is selected
      let matchesDateRange = true;

      if (dateRange && dateRange.start && dateRange.end) {
        const sessionDate = new Date(session?.start_time || '');
        const startDate = dateObjectToDate(dateRange.start);
        const endDate = dateObjectToDate(dateRange.end, true); // Pass true to set end date to 11:59 PM

        if (startDate && endDate) {
          matchesDateRange = sessionDate >= startDate && sessionDate <= endDate;
        }
      }

      // Return true only if both conditions are satisfied
      return matchesSearchTerm && matchesDateRange;
    });

    onFilterChange(filteredSessions);
  }, [searchQuery, dateRange, allSessionData]);

  return (
    <div className="p-6 max-w-6xl xl:min-w-[900px] mx-auto space-y-6">
      {' '}
      {/* Header & Search */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Past Classes</h1>
          <TimezoneIndicator />
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search by class name or topic..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
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

        <div>
          {/* Alert with a close button */}
          <Alert
            className="bg-blue-50 border-blue-200 relative"
            hidden={!isAlertVisible} // Hide the alert based on state
          >
            <div className="flex items-center">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-700 ml-2">
                Recordings are available for 30 days after the class. Make sure
                to download important recordings.
              </AlertDescription>
            </div>
            {/* Close button */}
            <button
              onClick={() => setIsAlertVisible(false)} // Hide the alert on click
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-blue-100 transition-colors"
            >
              <X className="h-4 w-4 text-blue-600" /> {/* "X" icon */}
            </button>
          </Alert>
        </div>
      </div>
      {/* Sessions List */}
      <div className="space-y-6">
        {pastSessionTableData.length > 0 ? (
          pastSessionTableData.map((sessionData) => (
            <PastSessionCard key={sessionData.id} sessionData={sessionData} />
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            No upcoming classes match your search criteria.
          </div>
        )}
      </div>
      {/* Timezone Indicator - Always show the user's current timezone */}
      <div className="mt-4">
        <TimezoneIndicator />
      </div>
    </div>
  );
};

export default PastSessions;
