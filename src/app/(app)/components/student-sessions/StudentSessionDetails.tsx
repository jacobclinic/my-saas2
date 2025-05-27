'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../base-v2/ui/Card';
import { Alert, AlertDescription } from '../base-v2/ui/Alert';
import { Info } from 'lucide-react';
import { SessionStudentTableData } from '~/lib/sessions/types/upcoming-sessions';
import StudentSessionDetailsHeader from './StudentSessionDetailsHeader';
import StudentSessionDetailsMaterials from './StudentSessionDetailsMaterials';
import StudentSessionDetailsActions from './StudentSessionDetailsActions';
import PaymentDialog from '../student-payments/PaymentDialog';
import { PastSession, UpcomingSession } from '~/lib/sessions/types/session-v2';
import { PaymentStatus } from '~/lib/payments/types/admin-payments';
import { ClassData } from '~/lib/classes/types/class-v2';
import { ClassWithTutorAndEnrollmentAndNextSession } from '~/lib/classes/types/class';
import { format as dateFnsFormat } from 'date-fns';
import { formatDateTimeRange } from '~/lib/utils/timezone-utils';

interface StudentSessionDetailsProps {
  sessionData: UpcomingSession | PastSession;
  type: 'next' | 'upcoming' | 'past';
  studentId: string;
  isEnrolledToClass: boolean;
  classData: ClassWithTutorAndEnrollmentAndNextSession;
}

const StudentSessionDetails = ({
  sessionData,
  type,
  studentId,
  isEnrolledToClass,
  classData,
}: StudentSessionDetailsProps) => {
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [formattedSessionData, setFormattedSessionData] =
    useState<SessionStudentTableData | null>(null);
  const [classTableData, setClassTableData] = useState<ClassData>();

  // Transform past sessions data
  useEffect(() => {
    if (sessionData) {
      const formattedPastSession = formatSessionData(sessionData);
      setFormattedSessionData(formattedPastSession);
    }

    if (classData) {
      // Ensure time_slots is an array before reducing

      const schedule =
        classData?.time_slots?.reduce(
          (acc: string, slot: any, index: number, array: any[]) => {
            const timeSlotString = `${slot.day}, ${slot.startTime} - ${slot.endTime}`;
            // Add a separator for all except the last item
            return (
              acc + timeSlotString + (index < array.length - 1 ? '; ' : '')
            );
          },
          '',
        ) || 'No schedule available';

      const formattedDate = classData?.nextSession
        ? dateFnsFormat(new Date(classData.nextSession), 'EEE, MMM dd, yyyy')
        : 'No upcoming session';

      const formattedData = {
        id: classData.id,
        name: classData?.name || 'No name provided',
        schedule: schedule,
        status: classData?.status || 'Unknown',
        registrationLink: '',
        nextClass: formattedDate,
        classRawData: classData,
      };

      setClassTableData(formattedData);
    }
  }, [sessionData]);
  // Helper function to format session data
  const formatSessionData = (
    sessionData: UpcomingSession | PastSession,
  ): SessionStudentTableData => {
    // Format date and time using timezone utility to respect user's timezone
    const { formattedDate, formattedTime } = formatDateTimeRange(
      sessionData.start_time,
      sessionData.end_time,
      'EEEE, MMMM d, yyyy',
      'h:mm a',
    );

    return {
      id: sessionData.id,
      name: sessionData.class?.name || '',
      topic: sessionData.title,
      date: formattedDate,
      time: formattedTime,
      paymentStatus:
        (sessionData.payment_status as PaymentStatus) || PaymentStatus.PENDING,
      paymentAmount:
        Number(sessionData.payment_amount) || sessionData.class?.fee || 0,
      zoomLink: sessionData.meeting_url || undefined,
      zoomMeetingId: sessionData.zoom_meeting_id || '',
      recordingUrl: sessionData.recording_urls || [],
      materials:
        sessionData.materials?.map((material) => ({
          id: material.id,
          name: material.name,
          file_size: material.file_size,
          url: material.url,
        })) || [],
      classId: sessionData.class?.id,
      sessionRawData: sessionData,
    };
  };

  if (!formattedSessionData) {
    return (
      <div className="text-center text-gray-500">
        <h2 className="text-2xl">No sessions found.</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Main Session Card */}
        <Card
          className={
            type === 'next' ? 'border-2 border-blue-200 bg-blue-50' : ''
          }
        >
          <CardContent className="p-6 space-y-6">
            <StudentSessionDetailsHeader
              sessionData={formattedSessionData}
              type={type}
            />

            <StudentSessionDetailsMaterials
              materials={formattedSessionData?.materials || []}
              type={type}
            />

            <StudentSessionDetailsActions
              sessionData={formattedSessionData}
              type={type}
              onPayment={() => setShowPaymentDialog(true)}
              isEnrolledToClass={isEnrolledToClass}
              classData={classTableData!}
            />
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Session Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Class</h3>
                <p className="mt-1">{formattedSessionData.name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Topic</h3>
                <p className="mt-1">{formattedSessionData.topic}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Duration</h3>
                <p className="mt-1">{formattedSessionData.time}</p>
              </div>
              {formattedSessionData.sessionRawData?.description && (
                <div className="col-span-2">
                  <h3 className="text-sm font-medium text-gray-500">
                    Description
                  </h3>
                  <p className="mt-1">
                    {formattedSessionData.sessionRawData.description}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Dialog */}
        {showPaymentDialog && (
          <PaymentDialog
            open={showPaymentDialog}
            onClose={() => setShowPaymentDialog(false)}
            sessionData={formattedSessionData}
            studentId={studentId}
          />
        )}
      </div>
    </div>
  );
};

export default StudentSessionDetails;
