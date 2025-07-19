'use client';
import React, { useEffect, useState } from 'react';
import ZoomMeeting from '~/app/(app)/components/zoom/v2/ZoomMeeting';
import { fetchZoomSessionBySessionId } from '~/lib/zoom_sessions/server-actions-v2';
import useUserSession from '~/core/hooks/use-user-session';


type ClassSessionPageProps = {
  params: {
    classId: string;
    sessionId: string;  
  };
};

const ClassSessionPage = ({ params }: ClassSessionPageProps) => {
  const [zoomSession, setZoomSession] = useState<any | null>(null);
  const userSession = useUserSession();

  const userEmail = userSession?.auth?.user?.email!;
  const userName = userSession?.data?.first_name! || userEmail ;

  useEffect(() => {
    const fetchZoomSession = async () => {
      const session = await fetchZoomSessionBySessionId(params.sessionId);
      if (session) {
        setZoomSession(session);
      }
    };
    fetchZoomSession();
  }, [params.sessionId]);

  return (
    <div>
      {zoomSession && (
        <ZoomMeeting params={{ ...params, zoomSession, userEmail, userName }} />
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