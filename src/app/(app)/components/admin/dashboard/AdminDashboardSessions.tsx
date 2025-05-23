'use client';

import React, { useEffect, useState } from 'react';
import type { UpcomingSessionTableData } from '~/lib/sessions/types/upcoming-sessions';
import { Input } from '../../base-v2/ui/Input';
import { Info, Search, X } from 'lucide-react';
import UpcommingSessionCard from './AdminSessionCard';
import { UpcomingSession } from '~/lib/sessions/types/session-v2';
import { DateRangePicker } from '@heroui/date-picker';
import AdminSessionCard from './AdminSessionCard';

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

const AdminDashboardSessions = ({
  upcomingSessionData,
  onFilterChange,
  allSessionData,
}: {
  upcomingSessionData: UpcomingSession[];
  onFilterChange: (filteredData: UpcomingSession[]) => void;
  allSessionData: UpcomingSession[];
}) => {
  const [searchTerm, setSearchTerm] = useState('');
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

      // Return true only if both conditions are satisfied
      return matchesSearchTerm;
    });

    // Call the parent's onFilterChange with the filtered data
    onFilterChange(filteredSessions);
  }, [searchTerm,  allSessionData]);

  return (
    <div className="xl:min-w-[900px] space-y-6">
      {/* Header & Search */}
      <div className="space-y-4">
        <h1 className="text-xl font-bold">Upcoming Classes</h1>

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
        </div>
      </div>

      {/* Classes List */}
      <div className="space-y-6">
        {upcomingSessionTableData.length > 0 ? (
          upcomingSessionTableData.map((sessionData) => (
            <AdminSessionCard
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

export default AdminDashboardSessions;
