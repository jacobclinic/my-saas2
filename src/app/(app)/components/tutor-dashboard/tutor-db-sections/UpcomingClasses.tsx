'use client';

import React, { useEffect, useState } from 'react';
import {
  UpcomingSessionTableData,
} from '~/lib/sessions/types/upcoming-sessions';
import UpcommingSessionClassCard from '../../upcoming-sessions/UpcommingSessionCard';
import { UpcomingSession } from '~/lib/sessions/types/session-v2';
import { formatToLocalTime } from '~/lib/utils/timezone-utils';

const UpcomingClassesSection = ({
  upcomingSessionDataPerWeek,
}: {
  upcomingSessionDataPerWeek: UpcomingSession[];
}) => {
  const [upcomingSessionTableData, setUpcomingSessionTableData] = useState<
    UpcomingSessionTableData[]
  >([]);

  useEffect(() => {
    if (upcomingSessionDataPerWeek && upcomingSessionDataPerWeek.length > 0) {
      const formattedData = upcomingSessionDataPerWeek.map((session) => {
        // Use consistent timezone-aware formatting to prevent hydration mismatches
        const formattedDate = formatToLocalTime(
          session?.start_time || '',
          'EEEE, MMMM d, yyyy' // "Monday, January 3, 2025"
        );

        const startTime = formatToLocalTime(
          session?.start_time || '',
          'h:mm a' // "2:30 PM"
        );
        
        const endTime = formatToLocalTime(
          session?.end_time || '',
          'h:mm a' // "3:30 PM"
        );
        
        const formattedTime = `${startTime} - ${endTime}`;

        return {
          id: session.id,
          name: `${session?.class?.name}`,
          subject: session?.class?.subject || '',
          date: formattedDate,
          time: formattedTime,
          registeredStudents: session?.class?.students?.length || 0,
          zoomLinkTutor: session?.meeting_url || '',
          zoomLinkStudent: session?.meeting_url || '',
          zoomMeetingId: session?.zoom_meeting_id || '',
          lessonTitle: session?.title || '',
          lessonDescription: session?.description || '',
          materials: (session?.materials || []).map((material) => ({
            id: material.id,
            name: material.name || '',
            url: material.url || '',
            file_size: material.file_size || '',
          })),
          sessionRawData: session,
        };
      });

      setUpcomingSessionTableData(formattedData);
    } else {
      setUpcomingSessionTableData([]);
    }
  }, [upcomingSessionDataPerWeek]);

  // console.log(
  //   'upcomingSessionDataPerWeek and activeClassesData:',
  //   upcomingSessionDataPerWeek,
  // );

  return (
    <>
      {/* Next Class */}
      <div className="space-y-2">
        <div className="flex items-center">
          <h2 className="text-xl font-bold">Upcoming Class</h2>
        </div>
        {upcomingSessionTableData.length > 0 ? (
          upcomingSessionTableData.map((sessionData) => (
            <UpcommingSessionClassCard
              key={sessionData.id}
              variant="dashboard"
              sessionData={sessionData}
            />
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            No upcoming classes match your search criteria.
          </div>
        )}
      </div>
    </>
  );
};

export default UpcomingClassesSection;
