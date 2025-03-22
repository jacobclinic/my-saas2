'use client';

import React, { useEffect, useState } from 'react';
import type {
  UpcomingSessionTableData,
} from '~/lib/sessions/types/upcoming-sessions';
import { Alert, AlertDescription } from '../base-v2/ui/Alert';
import { Input } from '../base-v2/ui/Input';
import { Info, Search, X } from 'lucide-react';
import UpcommingSessionCard from './UpcommingSessionCard';
import { UpcomingSession } from '~/lib/sessions/types/session-v2';
import { DateRangePicker } from '@heroui/date-picker';

// Define simplified interfaces based on what the component actually uses
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
}: {
  upcomingSessionData: UpcomingSession[];
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAlertVisible, setIsAlertVisible] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [upcomingSessionTableData, setUpcomingSessionTableData] = useState<
    UpcomingSessionTableData[]
  >([]);

  useEffect(() => {
    if (upcomingSessionData) {
      const formattedData: UpcomingSessionTableData[] = upcomingSessionData.map(
        (session) => {
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
            subject: session?.class?.subject || '',
            date: formattedDate,
            time: formattedTime,
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
        },
      );
      setUpcomingSessionTableData(formattedData);
    }
  }, [upcomingSessionData]);

  // Handle date range change - use any for now to avoid type issues
  const handleDateRangeChange = (value: any) => {
    setDateRange(value);
  };

  // Helper function to convert date object to JavaScript Date
  const dateObjectToDate = (dateObj: any): Date | null => {
    if (!dateObj) return null;
    return new Date(dateObj.year, dateObj.month - 1, dateObj.day);
  };

  return (
    <div className="p-6 max-w-6xl xl:min-w-[900px] mx-auto space-y-6">
      {/* Header & Search */}
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Upcoming Classes</h1>

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
            onChange={handleDateRangeChange} 
            className="w-full sm:w-auto border rounded-lg border-gray-300 "
          />
        </div>
      </div>

      {/* Quick Tip */}
      <Alert className="bg-blue-50 border-blue-200" hidden={!isAlertVisible}>
        <div className="flex items-center">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-700">
            Tip: Upload class materials at least 24 hours before the class to
            give students time to prepare.
          </AlertDescription>
        </div>
        {/* Close button */}
        <button
          onClick={() => setIsAlertVisible(false)} // Hide the alert on click
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-blue-100 transition-colors"
        >
          <X className="h-4 w-4 text-blue-600" />
        </button>
      </Alert>

      {/* Classes List */}
      <div className="space-y-6">
        {upcomingSessionTableData
          .filter((cls) => {
            // Apply search term filter
            const matchesSearchTerm = searchTerm
              ? cls.name.toLowerCase().includes(searchTerm.toLowerCase())
              : true;

            // Apply date range filter if dateRange is selected
            const sessionDate = new Date(cls.date);
            let matchesDateRange = true;
            
            if (dateRange && dateRange.start && dateRange.end) {
              const startDate = dateObjectToDate(dateRange.start);
              const endDate = dateObjectToDate(dateRange.end);
              
              if (startDate && endDate) {
                matchesDateRange = sessionDate >= startDate && sessionDate <= endDate;
              }
            }

            // Return true only if both conditions are satisfied
            return matchesSearchTerm && matchesDateRange;
          })
          .map((sessionData) => (
            <UpcommingSessionCard
              key={sessionData.id}
              sessionData={sessionData}
            />
          ))}
      </div>
    </div>
  );
};

export default UpcomingSessions;