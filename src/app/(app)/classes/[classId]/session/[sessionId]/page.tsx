'use client';
import React, { useEffect, useState } from 'react';
import { fetchZoomSessionBySessionIdAction, validateStudentPaymentForSessionAction } from '~/lib/zoom_sessions/server-actions-v2';
import useUserSession from '~/core/hooks/use-user-session';
import dynamic from 'next/dynamic';
import useUserRole from '~/lib/user/hooks/use-userRole';

// Zoom meeting is a client side only component
// Top level imports will not ensure it.
const ZoomMeeting = dynamic(
  () => import('~/app/(app)/components/zoom/v2/ZoomMeeting'),
  { ssr: false }
);

type ClassSessionPageProps = {
  params: {
    classId: string;
    sessionId: string;
  };
};

const ClassSessionPage = ({ params }: ClassSessionPageProps) => {
  const [zoomSession, setZoomSession] = useState<any | null>(null);
  const [error, setError] = useState("")
  const userSession = useUserSession();
  const { data: role } = useUserRole();

  const userEmail = userSession?.auth?.user?.email!;
  const userName = userSession?.data?.first_name! || userEmail;
  const isHost = role === "tutor" || role === "admin";

  useEffect(() => {
    const fetchZoomSession = async () => {
      try {
        const session = await fetchZoomSessionBySessionIdAction(params.sessionId);
        if (session) {
          setZoomSession(session);
          setError("");
        } else {
          setZoomSession(null);
          setError("A virtual classroom has not been set up for this session. Please contact the support if you think this is an error.");
        }
      } catch (error) {
        setError("Something went wrong while fetching the virtual classroom. Please try again and contact admin if the problem persists.");
      }
    };
    const validatePayment = async () => {
      if (!userSession) return;

      if (isHost) {
        fetchZoomSession();
        setError("");
        return;
      }

      // Validate student payment for the session
      const isValid = await validateStudentPaymentForSessionAction(params.sessionId, params.classId, userSession.auth.user.id);
      if (!isValid) {
        setError("You must complete the payment to access this session.");
      } else {
        // Only set zoom session if payment is valid
        fetchZoomSession();
        setError("");
      }
    };

    validatePayment();
  }, [params.sessionId, params.classId, userSession]);


  if (!zoomSession) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="max-w-md p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
          <h2 className="text-lg font-medium text-yellow-700 mb-2">No classroom session found</h2>
          <p className="text-sm text-yellow-600 mb-4">
            {error || "This session may not have a virtual classroom or it has not been set up yet."}
          </p>
        </div>
      </div>
    );
  }

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