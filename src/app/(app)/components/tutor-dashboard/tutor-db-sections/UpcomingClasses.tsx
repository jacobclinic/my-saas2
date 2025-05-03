'use client';

import React, { useEffect, useState } from 'react';
import { Info } from 'lucide-react';
import {
  UpcomingSessionTableData,
} from '~/lib/sessions/types/upcoming-sessions';
import UpcommingSessionClassCard from '../../upcoming-sessions/UpcommingSessionCard';
import { UpcomingSession } from '~/lib/sessions/types/session-v2';

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
        const formattedDate = new Date(
          session?.start_time || '',
        ).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        const formattedTime = `${new Date(
          session?.start_time || '',
        ).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: 'numeric',
          hour12: true,
        })} - ${new Date(session?.end_time || '').toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: 'numeric',
          hour12: true,
        })}`;

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
          <Info className="h-5 w-5 mr-2" />
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
