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


  useEffect(() => {
    const fetchZoomSession = async () => {
      const session = await fetchZoomSessionBySessionId(params.sessionId);
      setZoomSession(session);
    };
    fetchZoomSession();
  }, [params.sessionId]);

  return (
    <div>
      <ZoomMeeting params={{ ...params, zoomSession }} />
    </div>
  );
};

export default ClassSessionPage;