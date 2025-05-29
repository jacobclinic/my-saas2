'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../base-v2/ui/Card';
import { Alert, AlertDescription } from '../base-v2/ui/Alert';
import { Download, ExternalLink, FileText, Info, Video } from 'lucide-react';
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
import { Button } from '../base-v2/ui/Button';
import { Badge } from '../base-v2/ui/Badge';
import { PAYMENT_STATUS } from '~/lib/student-payments/constant';

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
  const renderClassAccess = () => {
    switch (formattedSessionData.paymentStatus) {
      case PAYMENT_STATUS.PENDING:
        return (
          <div className="text-sm text-gray-600">
            <Badge variant="yellow" className="mb-3">Payment Required</Badge>
            <p className="mb-4">To access this class, please complete the payment.</p>

            <Button
              variant="primary"
              onClick={() => setShowPaymentDialog(true)}
            >
              Pay Now
            </Button>
          </div>
        )
        break;
      case PAYMENT_STATUS.PENDING_VERIFICATION:
        return (
          <div className="text-sm text-gray-600">
            <Badge variant="yellow" className="mb-3">Payment Not Verified</Badge>
            <p className="mb-4">Your payment is under verification. Please wait for the
              confirmation.</p>
            <Button
              variant="primary"
            >
              Contact Admin
            </Button>
          </div>
        )
        break;
      case PAYMENT_STATUS.VERIFIED:
        return (
          <div className="text-sm text-gray-600">
            <Badge variant="green" className="mb-3">Payment Completed</Badge>
            <p className="mb-4">You have full access to this class, materials, and recordings.</p>

            {type !== 'past' && (
              <Button
                variant="primary"
                onClick={() => window.open(formattedSessionData.zoomLink, '_blank')}
              >
                <ExternalLink size={16} /> Join Class
              </Button>
            )}
          </div>
        )
    }
  }

  return (
    <div className="bg-gray-50 p-1 md:p-4 lg:p-6">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-2/3">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{formattedSessionData.name}</h1>
                  <div className="mt-2">
                    <Badge variant="blue">{"Subject"}</Badge>
                    {type !== 'past' && formattedSessionData.paymentStatus === PAYMENT_STATUS.PENDING ? (
                      <Badge variant="yellow" className="ml-2">Payment Required</Badge>
                    ) : null}
                    {type === "past" && <Badge variant="gray" className="ml-2">Completed</Badge>}

                  </div>
                </div>

                {type !== 'past' && formattedSessionData.paymentStatus === PAYMENT_STATUS.VERIFIED && (
                  <Button
                    variant="primary"
                    onClick={() => window.open(formattedSessionData.zoomLink, '_blank')}
                  >
                    <ExternalLink size={16} /> Join Class
                  </Button>
                )}
              </div>

              <div className="mt-8 space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Class Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Date & Time</p>
                      <p className="mt-1 text-sm text-gray-900">{formattedSessionData.date}, {formattedSessionData.time}</p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-500">Tutor</p>
                      <p className="mt-1 text-sm text-gray-900">{"Tutor Name"}</p>
                      <p className="text-sm text-gray-500">{"Tutor email"}</p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-500">Lesson</p>
                      {formattedSessionData.topic ? (
                        <p className="mt-1 text-sm text-gray-900">{formattedSessionData.topic}</p>
                      ) : (
                        <p className="mt-1 text-sm text-gray-500 italic">Lesson details will be updated soon</p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Class Materials</h3>
                  {formattedSessionData.materials && formattedSessionData.materials.length > 0 ? (
                    <div className="space-y-3">
                      {formattedSessionData.materials.map((material) => (
                        <div key={material.id} className="bg-gray-50 p-3 rounded-lg flex items-center justify-between">
                          <div className="flex items-center">
                            <FileText size={18} className="text-blue-600 mr-2" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{material.name}</p>
                              <p className="text-xs text-gray-500">{"material.type"} · {material.file_size}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(material.url || '', '_blank')}
                          >
                            <Download size={16} /> Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">No materials available for this class.</p>
                  )}
                </div>

                {true && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Class Recording</h3>
                    <div className="bg-gray-50 rounded-lg overflow-hidden">
                      <div className="aspect-video bg-gray-900 relative">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Video size={48} className="text-white opacity-70" />
                        </div>
                      </div>
                      <div className="p-4 flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Class Recording</p>
                          <p className="text-xs text-gray-500">Duration: {"recording.duration"}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                        // onClick={() => window.open(recording.url, '_blank')}
                        >
                          Watch Recording
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:w-1/3">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Class Access</h3>

              {renderClassAccess()}
            </CardContent>
          </Card>
        </div>
      </div>
      {showPaymentDialog && (
          <PaymentDialog
            open={showPaymentDialog}
            onClose={() => setShowPaymentDialog(false)}
            sessionData={formattedSessionData}
            studentId={studentId}
          />
        )}
    </div>
  );
};

export default StudentSessionDetails;
