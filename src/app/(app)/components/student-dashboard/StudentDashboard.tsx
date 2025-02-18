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

const StudentDashboard = ({
  upcomingSessionData, pastSessionData, studentId
}: {
  upcomingSessionData: UpcomingSession[], pastSessionData: PastSession[], studentId: string
}) => {
  const [isPending, startTransition] = useTransition();
  const [nextClass, setNextClass] = useState<SessionStudentTableData | null>(null);
  const [upcomingClasses, setUpcomingClasses] = useState<SessionStudentTableData[]>([]);
  const [pastClasses, setPastClasses] = useState<SessionStudentTableData[]>([]);

  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionStudentTableData | null>(null);

  // Transform upcoming sessions data
  useEffect(() => {
    if (upcomingSessionData?.length > 0) {
      // Format the next class (first upcoming session)
      const nextSessionData = upcomingSessionData[0];
      const formattedNextClass = formatSessionData(nextSessionData);
      setNextClass(formattedNextClass);

      // Format remaining upcoming classes
      const remainingUpcoming = upcomingSessionData.slice(1).map(formatSessionData);
      setUpcomingClasses(remainingUpcoming);
    }
  }, [upcomingSessionData]);

  // Transform past sessions data
  useEffect(() => {
    if (pastSessionData?.length > 0) {
      const formattedPastClasses = pastSessionData.map(formatSessionData);
      setPastClasses(formattedPastClasses);
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
      paymentStatus: sessionData.payment_status || 'pending',
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

  const joinMeetingAsStudent = useCallback(async (classData: any) => {
    startTransition(async () => {
      const result = await joinMeetingAsUser({
        meetingId: classData?.zoomMeetingId,
        studentData: {
          first_name: "suchira",
          last_name: "Student",
          email: "suchira.1@telzee.io"
        }
      });
      if (result.success) {
        window.open(result.start_url, "_blank");
      } else {
        alert("Failed to generate join link");
      }
    })
  }, [])

  // Sample data
  const nextClassSampleData = {
    id: 1,
    name: "A/L 2025 Accounting Batch 04",
    topic: "Manufacturing Accounts - Part 1",
    date: "Monday, Dec 18, 2024",
    time: "4:00 PM - 6:00 PM",
    zoomLink: "https://zoom.us/j/123456789",
    paymentStatus: "pending",
    paymentAmount: 5000,
    materials: [
      { id: 1, name: "Manufacturing Accounts Notes.pdf", file_size: "2.5 MB" },
      { id: 2, name: "Practice Problems Set.pdf", file_size: "1.8 MB" }
    ]
  };

  const upcomingClassesSampleData = [
    {
      id: 2,
      name: "A/L 2025 Accounting Batch 04",
      topic: "Manufacturing Accounts - Part 2",
      date: "Monday, Dec 25, 2024",
      time: "4:00 PM - 6:00 PM",
      paymentStatus: "paid",
      materials: [
        { id: 3, name: "Manufacturing Accounts Part 2.pdf", file_size: "3.0 MB" }
      ]
    }
  ];

  const pastClassesSampleData = [
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

  const NextClassCard = ({ classData }: { classData: SessionStudentTableData }) => (
    <Card className="border-2 border-blue-200 bg-blue-50">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl text-blue-800">Next Class</CardTitle>
            <p className="text-blue-700 font-medium mt-1">{classData.name}</p>
          </div>
          {classData.paymentStatus === PAYMENT_STATUS.PENDING && (
            <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100 border-red-500">
              Payment Pending
            </Badge>
          )}
          {classData.paymentStatus === PAYMENT_STATUS.PENDING_VERIFICATION && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-500">
              Payment pending verification
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="font-medium text-blue-900">{classData.topic}</h3>
          <div className="flex items-center text-blue-700">
            <Calendar className="h-4 w-4 mr-2" />
            {classData.date}
          </div>
          <div className="flex items-center text-blue-700">
            <Clock className="h-4 w-4 mr-2" />
            {classData.time}
          </div>
        </div>

        {classData.paymentStatus === PAYMENT_STATUS.PENDING ? (
          <Alert className="border-red-500 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              Please complete the payment of Rs. {classData.paymentAmount} to access the class
            </AlertDescription>
          </Alert>
        ) : classData.paymentStatus === PAYMENT_STATUS.PENDING_VERIFICATION ? (
          <Alert className="border-yellow-500 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-700">
              Payment is pending for verification from the admin. Please wait for the admin to verify the payment.
            </AlertDescription>
          </Alert>
        ) : null}

        {classData?.materials && classData?.materials?.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-blue-900">Class Materials</h4>
            <div className="space-y-2">
              {classData?.materials?.map((material) => (
                <div
                  key={material.id}
                  className="flex items-center justify-between bg-white p-2 rounded"
                >
                  <div className="flex items-center">
                    <File className="h-4 w-4 text-blue-600 mr-2" />
                    <span className="text-sm">{material.name}</span>
                  </div>
                  <span className="text-sm text-gray-600">{material.file_size}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {classData.paymentStatus === PAYMENT_STATUS.PENDING ? (
            <Button
              className="w-full bg-red-600 hover:bg-red-700"
              onClick={() => {
                setSelectedSession(classData);
                setShowPaymentDialog(true);
              }}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Make Payment
            </Button>
          ) : classData.paymentStatus === PAYMENT_STATUS.PENDING_VERIFICATION ? (
            null
          ) : (
            <Button className="w-full" onClick={() => joinMeetingAsStudent(classData)} disabled={isPending}>
              <Camera className="h-4 w-4 mr-2" />
              Join Class
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const ClassCard = ({ classData, type = "upcoming" }: { classData: SessionStudentTableData; type?: "upcoming" | "completed" | "past" }) => (
    <Card className="mb-4">
      <CardContent className="p-4 space-y-4">
        <div>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium">{classData.name}</h3>
              <p className="text-blue-600">{classData.topic}</p>
            </div>
            {classData.paymentStatus === PAYMENT_STATUS.PENDING && type === "upcoming" && (
              <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100 border-red-500">
                Payment Pending
              </Badge>
            )}
            {classData.paymentStatus === PAYMENT_STATUS.PENDING_VERIFICATION && type === "upcoming" && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-500">
                Payment pending verification
              </Badge>
            )}
          </div>
          <div className="flex items-center mt-2 text-gray-600">
            <Calendar className="h-4 w-4 mr-2" />
            {classData.date}
          </div>
          <div className="flex items-center mt-1 text-gray-600">
            <Clock className="h-4 w-4 mr-2" />
            {classData.time}
          </div>
        </div>

        {classData?.materials && classData.materials?.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Class Materials</h4>
            <div className="space-y-2">
              {classData?.materials?.map((material) => (
                <div
                  key={material.id}
                  className="flex items-center justify-between bg-gray-50 p-2 rounded"
                >
                  <div className="flex items-center">
                    <File className="h-4 w-4 text-blue-600 mr-2" />
                    <span className="text-sm">{material.name}</span>
                  </div>
                  <span className="text-sm text-gray-600">{material.file_size}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {type === "upcoming" ? (
            <>
              {classData.paymentStatus === PAYMENT_STATUS.PENDING ? (
                <Button
                  className="bg-red-600 hover:bg-red-700" 
                  onClick={() => {
                    setSelectedSession(classData);
                    setShowPaymentDialog(true);
                  }}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Make Payment
                </Button>
              ) : classData.paymentStatus === PAYMENT_STATUS.PENDING_VERIFICATION ? (
                null
              ) : (
                <Button className="w-full" onClick={() => joinMeetingAsStudent(classData)} disabled={isPending}>
                  <Camera className="h-4 w-4 mr-2" />
                  Join Class
                </Button>
              )}
            </>
          ) : (
            <>
              <Button onClick={() => window.open(classData.recordingUrl, '_blank')}>
                <Video className="h-4 w-4 mr-2" />
                Watch Recording
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download Materials
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );

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

        {/* Next Class */}
        {nextClass && <NextClassCard classData={nextClass} />}

        {/* Upcoming Classes */}
        {upcomingClasses.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              <h2 className="text-xl font-bold">Upcoming Classes</h2>
            </div>
            {upcomingClasses.map(classData => (
              <ClassCard key={classData.id} classData={classData} type="upcoming" />
            ))}
          </div>
        )}

        {/* Past Classes */}
        {pastClasses.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center">
              <MonitorPlay className="h-5 w-5 mr-2" />
              <h2 className="text-xl font-bold">Past Classes</h2>
            </div>
            {pastClasses.map(classData => (
              <ClassCard key={classData.id} classData={classData} type="past" />
            ))}
          </div>
        )}

        {/* Past Classes */}
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