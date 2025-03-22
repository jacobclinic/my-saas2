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
}: {
  pastSessionsData: PastSession[];
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
            topic: session?.title || '',
            date: formattedDate,
            time: formattedTime,
            recordingUrl: session?.recording_urls?.[0] ?? '',
            zoomLinkStudent: session?.meeting_url || '',
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
        },
      );
      setPastSessionTableData(formattedData);
    }
  }, [pastSessionsData]);

  const handleDateRangeChange = (value: any) => {
    setDateRange(value);
  };

  const dateObjectToDate = (dateObj: any): Date | null => {
    if (!dateObj) return null;
    return new Date(dateObj.year, dateObj.month - 1, dateObj.day);
  };

  // Sample past classes data
  const pastSessionsSampleData: PastSessionData[] = [
    {
      id: '1',
      name: '2025 A-Levels Batch 1',
      topic: 'Manufacturing Accounts - Part 1',
      date: 'Monday, Dec 11, 2024',
      time: '4:00 PM - 6:00 PM',
      recordingUrl: 'https://zoom.us/rec/123',
      attendance: [
        { name: 'Alice Johnson', joinTime: '3:58 PM', duration: '1h 55m' },
        { name: 'Bob Wilson', joinTime: '3:59 PM', duration: '1h 54m' },
        { name: 'Carol Smith', joinTime: '4:02 PM', duration: '1h 52m' },
      ],
      materials: [
        {
          id: '1',
          name: 'Manufacturing Accounts Notes.pdf',
          file_size: '2.5 MB',
          url: 'https://example.com/materials/1',
        },
        {
          id: '2',
          name: 'Practice Problems.pdf',
          file_size: '1.8 MB',
          url: 'https://example.com/materials/2',
        },
      ],
    },
    {
      id: '2',
      name: '2024 A-Levels Revision Batch',
      topic: 'Financial Statements Analysis',
      date: 'Sunday, Dec 10, 2024',
      time: '6:30 PM - 8:30 PM',
      recordingUrl: 'https://zoom.us/rec/456',
      attendance: [
        { name: 'David Brown', joinTime: '6:28 PM', duration: '1h 58m' },
        { name: 'Eve Clark', joinTime: '6:29 PM', duration: '1h 57m' },
      ],
      materials: [
        {
          id: '3',
          name: 'Financial Analysis Notes.pdf',
          file_size: '3.2 MB',
          url: 'https://example.com/materials/3',
        },
      ],
    },
    {
      id: '3',
      name: '2025 A-Levels Batch 1',
      topic: 'Manufacturing Accounts - Part 1',
      date: 'Monday, Jan 11, 2025',
      time: '4:00 PM - 6:00 PM',
      recordingUrl: 'https://zoom.us/rec/123',
      attendance: [
        { name: 'Alice Johnson', joinTime: '3:58 PM', duration: '1h 55m' },
        { name: 'Bob Wilson', joinTime: '3:59 PM', duration: '1h 54m' },
        { name: 'Carol Smith', joinTime: '4:02 PM', duration: '1h 52m' },
      ],
      materials: [
        {
          id: '1',
          name: 'Manufacturing Accounts Notes.pdf',
          file_size: '2.5 MB',
          url: 'https://example.com/materials/1',
        },
        {
          id: '2',
          name: 'Practice Problems.pdf',
          file_size: '1.8 MB',
          url: 'https://example.com/materials/2',
        },
      ],
    },
    {
      id: '4',
      name: '2025 A-Levels Batch 1',
      topic: 'Manufacturing Accountsssssss - Part 1',
      date: 'Monday, Jan 20, 2025',
      time: '4:00 PM - 6:00 PM',
      recordingUrl: 'https://zoom.us/rec/123',
      attendance: [
        { name: 'Alice Johnson', joinTime: '3:58 PM', duration: '1h 55m' },
        { name: 'Bob Wilson', joinTime: '3:59 PM', duration: '1h 54m' },
        { name: 'Carol Smith', joinTime: '4:02 PM', duration: '1h 52m' },
      ],
      materials: [
        {
          id: '1',
          name: 'Manufacturing Accounts Notes.pdf',
          file_size: '2.5 MB',
          url: 'https://example.com/materials/1',
        },
        {
          id: '2',
          name: 'Practice Problems.pdf',
          file_size: '1.8 MB',
          url: 'https://example.com/materials/2',
        },
      ],
    },
    {
      id: '5',
      name: '2025 A-Levels Batch 1',
      topic: 'Manufacturing Accounts - Part 1',
      date: 'Monday, Feb 11, 2025',
      time: '4:00 PM - 6:00 PM',
      recordingUrl: 'https://zoom.us/rec/123',
      attendance: [
        { name: 'Alice Johnson', joinTime: '3:58 PM', duration: '1h 55m' },
        { name: 'Bob Wilson', joinTime: '3:59 PM', duration: '1h 54m' },
        { name: 'Carol Smith', joinTime: '4:02 PM', duration: '1h 52m' },
      ],
      materials: [
        {
          id: '1',
          name: 'Manufacturing Accounts Notes.pdf',
          file_size: '2.5 MB',
          url: 'https://example.com/materials/1',
        },
        {
          id: '2',
          name: 'Practice Problems.pdf',
          file_size: '1.8 MB',
          url: 'https://example.com/materials/2',
        },
      ],
    },
    {
      id: '6',
      name: '2025 A-Levels Batch 1',
      topic: 'Manufacturing Accounts - Part 1',
      date: 'Monday, Mar 10, 2025',
      time: '4:00 PM - 6:00 PM',
      recordingUrl: 'https://zoom.us/rec/123',
      attendance: [
        { name: 'Alice Johnson', joinTime: '3:58 PM', duration: '1h 55m' },
        { name: 'Bob Wilson', joinTime: '3:59 PM', duration: '1h 54m' },
        { name: 'Carol Smith', joinTime: '4:02 PM', duration: '1h 52m' },
      ],
      materials: [
        {
          id: '1',
          name: 'Manufacturing Accounts Notes.pdf',
          file_size: '2.5 MB',
          url: 'https://example.com/materials/1',
        },
        {
          id: '2',
          name: 'Practice Problems.pdf',
          file_size: '1.8 MB',
          url: 'https://example.com/materials/2',
        },
      ],
    },
    {
      id: '7',
      name: '2025 A-Levels Batch 1',
      topic: 'Manufacturing Accounts - Part 1',
      date: 'Monday, Dec 11, 2024',
      time: '4:00 PM - 6:00 PM',
      recordingUrl: 'https://zoom.us/rec/123',
      attendance: [
        { name: 'Alice Johnson', joinTime: '3:58 PM', duration: '1h 55m' },
        { name: 'Bob Wilson', joinTime: '3:59 PM', duration: '1h 54m' },
        { name: 'Carol Smith', joinTime: '4:02 PM', duration: '1h 52m' },
      ],
      materials: [
        {
          id: '1',
          name: 'Manufacturing Accounts Notes.pdf',
          file_size: '2.5 MB',
          url: 'https://example.com/materials/1',
        },
        {
          id: '2',
          name: 'Practice Problems.pdf',
          file_size: '1.8 MB',
          url: 'https://example.com/materials/2',
        },
      ],
    },
    {
      id: '8',
      name: '2025 A-Levels Batch 1',
      topic: 'Manufacturing Accounts - Part 1',
      date: 'Monday, Dec 11, 2024',
      time: '4:00 PM - 6:00 PM',
      recordingUrl: 'https://zoom.us/rec/123',
      attendance: [
        { name: 'Alice Johnson', joinTime: '3:58 PM', duration: '1h 55m' },
        { name: 'Bob Wilson', joinTime: '3:59 PM', duration: '1h 54m' },
        { name: 'Carol Smith', joinTime: '4:02 PM', duration: '1h 52m' },
      ],
      materials: [
        {
          id: '1',
          name: 'Manufacturing Accounts Notes.pdf',
          file_size: '2.5 MB',
          url: 'https://example.com/materials/1',
        },
        {
          id: '2',
          name: 'Practice Problems.pdf',
          file_size: '1.8 MB',
          url: 'https://example.com/materials/2',
        },
      ],
    },
    {
      id: '9',
      name: '2025 A-Levels Batch 1',
      topic: 'Manufacturing Accounts - Part 1',
      date: 'Monday, Dec 11, 2024',
      time: '4:00 PM - 6:00 PM',
      recordingUrl: 'https://zoom.us/rec/123',
      attendance: [
        { name: 'Alice Johnson', joinTime: '3:58 PM', duration: '1h 55m' },
        { name: 'Bob Wilson', joinTime: '3:59 PM', duration: '1h 54m' },
        { name: 'Carol Smith', joinTime: '4:02 PM', duration: '1h 52m' },
      ],
      materials: [
        {
          id: '1',
          name: 'Manufacturing Accounts Notes.pdf',
          file_size: '2.5 MB',
          url: 'https://example.com/materials/1',
        },
        {
          id: '2',
          name: 'Practice Problems.pdf',
          file_size: '1.8 MB',
          url: 'https://example.com/materials/2',
        },
      ],
    },
    {
      id: '10',
      name: '2025 A-Levels Batch 1',
      topic: 'Manufacturing Accounts - Part 1',
      date: 'Monday, Dec 11, 2024',
      time: '4:00 PM - 6:00 PM',
      recordingUrl: 'https://zoom.us/rec/123',
      attendance: [
        { name: 'Alice Johnson', joinTime: '3:58 PM', duration: '1h 55m' },
        { name: 'Bob Wilson', joinTime: '3:59 PM', duration: '1h 54m' },
        { name: 'Carol Smith', joinTime: '4:02 PM', duration: '1h 52m' },
      ],
      materials: [
        {
          id: '1',
          name: 'Manufacturing Accounts Notes.pdf',
          file_size: '2.5 MB',
          url: 'https://example.com/materials/1',
        },
        {
          id: '2',
          name: 'Practice Problems.pdf',
          file_size: '1.8 MB',
          url: 'https://example.com/materials/2',
        },
      ],
    },
    {
      id: '11',
      name: '2025 A-Levels Batch 1',
      topic: 'Manufacturing Accounts - Part 1',
      date: 'Monday, Dec 11, 2024',
      time: '4:00 PM - 6:00 PM',
      recordingUrl: 'https://zoom.us/rec/123',
      attendance: [
        { name: 'Alice Johnson', joinTime: '3:58 PM', duration: '1h 55m' },
        { name: 'Bob Wilson', joinTime: '3:59 PM', duration: '1h 54m' },
        { name: 'Carol Smith', joinTime: '4:02 PM', duration: '1h 52m' },
      ],
      materials: [
        {
          id: '1',
          name: 'Manufacturing Accounts Notes.pdf',
          file_size: '2.5 MB',
          url: 'https://example.com/materials/1',
        },
        {
          id: '2',
          name: 'Practice Problems.pdf',
          file_size: '1.8 MB',
          url: 'https://example.com/materials/2',
        },
      ],
    },
  ];

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
            onChange={handleDateRangeChange}
            className="w-full sm:w-auto"
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
        {pastSessionTableData
          .filter((session) => {
            // Apply both search term and date range filters
            const matchesSearchTerm = searchQuery
              ? session.name.toLowerCase().includes(searchQuery.toLowerCase())
              : true;

            // Apply date range filter if dateRange is selected
            const sessionDate = new Date(session.date);
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
            <PastSessionsCard key={sessionData.id} sessionData={sessionData} />
          ))}
      </div>
    </div>
  );
};

export default PastSessions;
