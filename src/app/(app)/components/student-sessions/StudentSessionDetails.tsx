'use client'

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../base-v2/ui/Card";
import { Alert, AlertDescription } from "../base-v2/ui/Alert";
import { Info } from 'lucide-react';
import { SessionStudentTableData } from '~/lib/sessions/types/upcoming-sessions';
import StudentSessionDetailsHeader from './StudentSessionDetailsHeader';
import StudentSessionDetailsMaterials from './StudentSessionDetailsMaterials';
import StudentSessionDetailsActions from './StudentSessionDetailsActions';
import PaymentDialog from '../student-payments/PaymentDialog';
import { PastSession, UpcomingSession } from '~/lib/sessions/types/session-v2';

interface StudentSessionDetailsProps {
  sessionData: UpcomingSession | PastSession;
  type: 'next' | 'upcoming' | 'past';
  studentId: string;
}

const StudentSessionDetails = ({ sessionData, type, studentId }: StudentSessionDetailsProps) => {
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [formattedSessionData, setFormattedSessionData] = useState<SessionStudentTableData | null>(null);

  // Transform past sessions data
  useEffect(() => {
    if (sessionData) {
      const formattedPastSession = formatSessionData(sessionData);
      setFormattedSessionData(formattedPastSession);
    }
  }, [sessionData]);

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

  if (!formattedSessionData) {
    return (
			<div className="text-center text-gray-500">
				<h2 className="text-2xl">No sessions found.</h2>
			</div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Important Info Alert */}
        {type !== 'past' && (
          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-700">
              Join your class 5 minutes early to ensure a smooth start. Don&apos;t forget to check the class materials beforehand!
            </AlertDescription>
          </Alert>
        )}

        {/* Main Session Card */}
        <Card className={type === 'next' ? 'border-2 border-blue-200 bg-blue-50' : ''}>
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
                  <h3 className="text-sm font-medium text-gray-500">Description</h3>
                  <p className="mt-1">{formattedSessionData.sessionRawData.description}</p>
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