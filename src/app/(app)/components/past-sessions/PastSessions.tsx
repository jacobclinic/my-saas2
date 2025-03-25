'use client';

import React, { useEffect, useState } from 'react';
import type { PastSessionData } from '~/lib/sessions/types/past-sessions';
import { Input } from '../base-v2/ui/Input';
import { Alert, AlertDescription } from '../base-v2/ui/Alert';
import { Search, Info, X } from 'lucide-react';
import PastSessionsCard from './PastSessionCard';
import { PastSession } from '~/lib/sessions/types/session-v2';
import 'react-datepicker/dist/react-datepicker.css';
import { DateRangePicker } from '@heroui/date-picker';
import { initial } from 'cypress/types/lodash';

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
      const formattedData: PastSessionData[] = pastSessionsData.map((session) =>
        formatSessionData(session),
      );
      setPastSessionTableData(formattedData);
    }
  }, [pastSessionsData]);

  const formatSessionData = (session: PastSession): PastSessionData => {
    const formattedDate = new Date(
      session?.start_time || '',
    ).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = `${new Date(session?.start_time || '').toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })} - 
          ${new Date(session?.end_time || '').toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}`;
    return {
      id: session.id,
      name: `${session?.class?.name}`,
      topic: session?.title || '',
      date: formattedDate,
      time: formattedTime,
      recordingUrl: session?.recording_urls?.[0] ?? '',
      attendance:
        (session?.attendance || []).map((attendee) => {
          const formattedTime = `${attendee?.time ? new Date(attendee?.time).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }) : ''}`;
          return {
            name: `${attendee?.student?.first_name} ${attendee?.student?.last_name}`,
            joinTime: formattedTime,
            duration: '',
          };
        }) || [],
      materials: (session.materials || []).map((material) => {
        return {
          id: material.id,
          name: material.name || '',
          url: material.url || '',
          file_size: material.file_size || '',
        };
      }),
    };
  };

  const handleDateRangeChange = (value: any) => {
    setDateRange(value);
  };

  const dateObjectToDate = (dateObj: any): Date | null => {
    if (!dateObj) return null;
    return new Date(dateObj.year, dateObj.month - 1, dateObj.day);
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
        const endDate = dateObjectToDate(dateRange.end);

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
      {/* Header & Search */}
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Past Classes</h1>

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
            aria-label='Date Range'
            onChange={handleDateRangeChange}
            className="w-full sm:w-auto border rounded-lg border-gray-300"
          />
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
            <PastSessionsCard
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

export default PastSessions;
