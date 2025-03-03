'use client'

import React, { useCallback, useEffect, useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../base-v2/ui/Card";
import { Button } from "../base-v2/ui/Button";
import { Badge } from "../base-v2/ui/Badge";
import { Alert, AlertDescription } from "../base-v2/ui/Alert";
import {
  Video,
  Clock,
  Calendar,
  File,
  DollarSign,
  Camera,
  Download,
  AlertTriangle,
  Info,
  MonitorPlay
} from 'lucide-react';
import { PastSession, UpcomingSession } from '~/lib/sessions/types/session-v2';
import { SessionStudentTableData } from '~/lib/sessions/types/upcoming-sessions';
import PaymentDialog from '../student-payments/PaymentDialog';
import { PAYMENT_STATUS } from '~/lib/student-payments/constant';
import { joinMeetingAsUser } from '~/lib/zoom/server-actions-v2';
import useUserSession from '~/core/hooks/use-user-session';
import StudentSessionCard from './StudentSessionCard';
import StudentNextSessionCard from './StudentNextSessionCard';
import { PaymentStatus } from '~/lib/payments/types/admin-payments';

const StudentDashboard = ({
  upcomingSessionData, pastSessionData, studentId
}: {
  upcomingSessionData: UpcomingSession[], pastSessionData: PastSession[], studentId: string
}) => {
  const userSession = useUserSession();
  const [isPending, startTransition] = useTransition();
  const [nextSession, setNextSession] = useState<SessionStudentTableData | null>(null);
  const [upcomingSessions, setUpcomingSessions] = useState<SessionStudentTableData[]>([]);
  const [pastSessions, setPastSessions] = useState<SessionStudentTableData[]>([]);

  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionStudentTableData | null>(null);

  // Transform upcoming sessions data
  useEffect(() => {
    if (upcomingSessionData?.length > 0) {
      // Format the next Sessions (first upcoming session)
      const nextSessionData = upcomingSessionData[0];
      const formattedNextSession = formatSessionData(nextSessionData);
      setNextSession(formattedNextSession);

      // Format remaining upcoming sessions
      const remainingUpcoming = upcomingSessionData.slice(1).map(formatSessionData);
      setUpcomingSessions(remainingUpcoming);
    }
  }, [upcomingSessionData]);

  // Transform past sessions data
  useEffect(() => {
    if (pastSessionData?.length > 0) {
      const formattedPastSessions = pastSessionData.map(formatSessionData);
      setPastSessions(formattedPastSessions);
    }
  }, [pastSessionData]);

  // Helper function to format session data
  const formatSessionData = (sessionData: UpcomingSession | PastSession): SessionStudentTableData => {
    const formattedDate = new Date(sessionData.start_time || "").toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const formattedTime = `${
      new Date(sessionData.start_time || "").toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      })
    } - ${
      new Date(sessionData.end_time || sessionData.start_time || "").toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      })
    }`;

    return {
      id: sessionData.id,
      name: sessionData.class?.name || '',
      topic: sessionData.title,
      date: formattedDate,
      time: formattedTime,
      paymentStatus: sessionData.payment_status as PaymentStatus || PaymentStatus.PENDING,
      paymentAmount: Number(sessionData.payment_amount) || sessionData.class?.fee || 0,
      zoomLink: sessionData.meeting_url || undefined,
      zoomMeetingId: sessionData.zoom_meeting_id || '',
      recordingUrl: Array.isArray(sessionData.recording_urls) && sessionData.recording_urls.length > 0 
        ? sessionData.recording_urls[0] 
        : undefined,
      materials: sessionData.materials?.map(material => ({
        id: material.id,
        name: material.name,
        file_size: material.file_size,
        url: material.url
      })) || [],
      classId: sessionData.class?.id,
      sessionRawData: sessionData,
    };
  };

  const joinMeetingAsStudent = useCallback(async (sessionData: any) => {
    startTransition(async () => {
      const result = await joinMeetingAsUser({
        meetingId: sessionData?.zoomMeetingId,
        studentData: {
          first_name: userSession?.data?.first_name || "",
          last_name: userSession?.data?.last_name || "",
          email: userSession?.auth?.user?.email || ""
        }
      });
      if (result.success) {
        window.open(result.start_url, "_blank");
      } else {
        alert("Failed to generate join link");
      }
    })
  }, [userSession])

  // Sample data
  const nextSessionsSampleData = {
    id: 1,
    name: "A/L 2025 Accounting Batch 04",
    topic: "Manufacturing Accounts - Part 1",
    date: "Monday, Dec 18, 2024",
    time: "4:00 PM - 6:00 PM",
    zoomLink: "https://zoom.us/j/123456789",
    paymentStatus: PaymentStatus.PENDING,
    paymentAmount: 5000,
    materials: [
      { id: 1, name: "Manufacturing Accounts Notes.pdf", file_size: "2.5 MB" },
      { id: 2, name: "Practice Problems Set.pdf", file_size: "1.8 MB" }
    ]
  };

  const upcomingSessionsSampleData = [
    {
      id: 2,
      name: "A/L 2025 Accounting Batch 04",
      topic: "Manufacturing Accounts - Part 2",
      date: "Monday, Dec 25, 2024",
      time: "4:00 PM - 6:00 PM",
      paymentStatus: PaymentStatus.VERIFIED,
      materials: [
        { id: 3, name: "Manufacturing Accounts Part 2.pdf", file_size: "3.0 MB" }
      ]
    }
  ];

  const pastSessionsSampleData = [
    {
      id: 3,
      name: "A/L 2025 Accounting Batch 04",
      topic: "Introduction to Manufacturing Accounts",
      date: "Monday, Dec 11, 2024",
      time: "4:00 PM - 6:00 PM",
      recordingUrl: "https://zoom.us/rec/123",
      materials: [
        { id: 4, name: "Introduction Notes.pdf", file_size: "2.2 MB" },
        { id: 5, name: "Homework Problems.pdf", file_size: "1.5 MB" }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Tips Alert */}
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-700">
            Join your class 5 minutes early to ensure a smooth start. Don&apos;t forget to check the class materials beforehand!
          </AlertDescription>
        </Alert>

        {/* Next ClaSessionsss */}
        {nextSession && 
          <StudentNextSessionCard
            key={nextSession.id}
            sessionData={nextSession}
            isPending={isPending}
            setSelectedSession={setSelectedSession}
            setShowPaymentDialog={setShowPaymentDialog}
            joinMeetingAsStudent={joinMeetingAsStudent}
          />
        }

        {/* Upcoming Sessions */}
        {upcomingSessions.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              <h2 className="text-xl font-bold">Upcoming Classes</h2>
            </div>
            {upcomingSessions.map(sessionData => (
              <StudentSessionCard
                key={sessionData.id}
                sessionData={sessionData}
                type="upcoming"
                isPending={isPending}
                setSelectedSession={setSelectedSession}
                setShowPaymentDialog={setShowPaymentDialog}
                joinMeetingAsStudent={joinMeetingAsStudent}
              />
            ))}
          </div>
        )}

        {/* Past Sessions */}
        {pastSessions.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center">
              <MonitorPlay className="h-5 w-5 mr-2" />
              <h2 className="text-xl font-bold">Past Classes</h2>
            </div>
            {pastSessions.map(sessionData => (
              <StudentSessionCard
                key={sessionData.id}
                sessionData={sessionData}
                type="past"
                isPending={isPending}
                setSelectedSession={setSelectedSession}
                setShowPaymentDialog={setShowPaymentDialog}
                joinMeetingAsStudent={joinMeetingAsStudent}
              />
            ))}
          </div>
        )}

        {/* Past Sessions */}
        {showPaymentDialog && selectedSession && (
          <PaymentDialog
            open={showPaymentDialog}
            onClose={() => setShowPaymentDialog(false)}
            sessionData={selectedSession}
            studentId={studentId}
          />
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;