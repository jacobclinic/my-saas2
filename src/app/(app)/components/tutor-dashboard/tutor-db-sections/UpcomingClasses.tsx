'use client';

import React, { useEffect, useState } from 'react';
import { Info } from 'lucide-react';
import {
  UpcomingSessionTableData,
  UploadedMaterial,
} from '~/lib/sessions/types/upcoming-sessions';
import UpcommingSessionClassCard from '../../upcoming-sessions/UpcommingSessionCard';
import { ClassType } from '~/lib/classes/types/class-v2';
import { UpcomingSession } from '~/lib/sessions/types/session-v2';

const UpcomingClassesSection = ({
  nextSessionData,
}: {
  nextSessionData: UpcomingSession[];
}) => {
  const [upcomingSessionTableData, setUpcomingSessionTableData] =
    useState<UpcomingSessionTableData>();

  useEffect(() => {
    if (nextSessionData && nextSessionData.length > 0) {
      const session = nextSessionData[0];
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
      const formattedData: UpcomingSessionTableData = {
        id: session.id,
        name: `${session?.class?.name}`,
        subject: session?.class?.subject || '',
        date: formattedDate,
        time: formattedTime,
        registeredStudents: session?.class?.students?.length || 0,
        zoomLinkTutor: session?.meeting_url || '',
        zoomLinkStudent: session?.meeting_url || '',
        zoomMeetingId: session?.zoom_meeting_id || '',
        materials: (session?.materials || []).map((material) => {
          return {
            id: material.id,
            name: material.name || '',
            url: material.url || '',
            file_size: material.file_size || '',
          };
        }),
      };
      setUpcomingSessionTableData(formattedData);
    }
  }, [nextSessionData]);

  console.log(
    'nextSessionData and activeClassesData:',
    nextSessionData,
  );

  return (
    <>
      {/* Next Class */}
      <div className="space-y-2">
        <div className="flex items-center">
          <Info className="h-5 w-5 mr-2" />
          <h2 className="text-xl font-bold">Upcoming Class</h2>
        </div>
        {upcomingSessionTableData ? (
          <UpcommingSessionClassCard
            sessionData={upcomingSessionTableData}
            variant="dashboard"
          />
        ) : null}
      </div>
    </>
  );
};

export default UpcomingClassesSection;
