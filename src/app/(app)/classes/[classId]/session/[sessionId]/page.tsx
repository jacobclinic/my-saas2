'use client';
import React, { useEffect, useState } from 'react';
import { fetchZoomSessionBySessionIdAction, validateStudentPaymentForSessionAction } from '~/lib/zoom_sessions/server-actions-v2';
import useUserSession from '~/core/hooks/use-user-session';
import dynamic from 'next/dynamic';
import useUserRole from '~/lib/user/hooks/use-userRole';
import { isFirstWeekOfMonth } from '~/lib/utils/date-utils';
import Spinner from '~/core/ui/Spinner';
import { generateZoomCustomerKeyMappingAction, markStudentAttendanceManualAction } from '~/lib/attendance/server-actions';
import useCsrfToken from '~/core/hooks/use-csrf-token';


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
  const [isLoading, setIsLoading] = useState(true);
  const userSession = useUserSession();
  const [customerKey, setCustomerKey] = useState<string | null>(null);
  const { data: role } = useUserRole();
  const csrfToken = useCsrfToken();

  const userId = userSession?.auth?.user?.id!;
  const userEmail = userSession?.auth?.user?.email!;
  const userName = userSession?.data?.first_name! || userEmail;
  const isHost = role === "tutor" || role === "admin";


  useEffect(() => {
    const fetchZoomSession = async () => {
      try {
        const session = await fetchZoomSessionBySessionIdAction(params.sessionId);
        const customerKeyResponse = await generateZoomCustomerKeyMappingAction({ sessionId: params.sessionId, csrfToken: csrfToken });
        if (customerKeyResponse.success && customerKeyResponse.customerKey) {
          console.log("Customer key generated", customerKeyResponse.customerKey);
          setCustomerKey(customerKeyResponse.customerKey);
        }
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
      try {
        if (!userSession) return;
        if (isHost) {
          await fetchZoomSession();
          setError("");
          return;
        }
        const isFirstWeek = isFirstWeekOfMonth(new Date());
        if (isFirstWeek) {
          await fetchZoomSession();
          setError("");
          return;
        }
        const isValid = await validateStudentPaymentForSessionAction(params.sessionId, params.classId, userSession.auth.user.id);

        if (!isValid) {
          setError("You must complete the payment to access this session.");
        } else {
          await fetchZoomSession();
          setError("");
        }
      } catch (error) {
        setIsLoading(false);
        setError("Something went wrong while validating the payment. Please try again and contact admin if the problem persists.");
      }
    };

    validatePayment();
  }, [params.sessionId, params.classId, userSession]);

  const onInitSuccess = () => {
    setIsLoading(false);
  }

  const onInitError = (error: any) => {
    setError("Something went wrong while initializing the virtual classroom. Please try again and contact admin if the problem persists.");
  }

  const onJoinSuccess = async () => {
    await markStudentAttendanceManualAction({ sessionId: params.sessionId, userId: userId, csrfToken: csrfToken });
  }

  if (isLoading && !zoomSession) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Spinner />
        <p className="text-gray-500 mt-4">Preparing your virtual classroom...</p>
      </div>
    );
  }


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
      {zoomSession && customerKey && (
        <ZoomMeeting params={{ ...params, zoomSession, customerKey, userName }}
          onInitSuccess={onInitSuccess}
          onInitError={onInitError}
          onJoinSuccess={onJoinSuccess} />
      )}
    </div>
  );
};

export default ClassSessionPage;