'use client';
import React, { useEffect, useState } from 'react';
import ZoomMeeting from '~/app/(app)/components/zoom/v2/ZoomMeeting';
import { fetchZoomSessionBySessionId } from '~/lib/zoom_sessions/server-actions-v2';

type ClassSessionPageProps = {
  params: {
    classId: string;
    sessionId: string;  
  };
};

const ClassSessionPage = ({ params }: ClassSessionPageProps) => {
  const [zoomSession, setZoomSession] = useState<any | null>(null);

  console.log("Zoom session: starting", zoomSession);

  useEffect(() => {
    const fetchZoomSession = async () => {
      const session = await fetchZoomSessionBySessionId(params.sessionId);
      console.log("Zoom session: fetched", session);
      if (session) {
        setZoomSession(session);
      }
    };
    fetchZoomSession();
  }, [params.sessionId]);
  

  return (
    <div>
      {zoomSession && (
        <ZoomMeeting params={{ ...params, zoomSession }} />
      )}
      {
        !zoomSession && (
          <p>Loading...</p>
        )
      }
    </div>
  );
};

export default ClassSessionPage;