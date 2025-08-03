'use client'

import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../base-v2/ui/Card";
import { Button } from "../base-v2/ui/Button";
import { Badge } from "../base-v2/ui/Badge";
import {
  Clock,
  Calendar,
  DollarSign,
  User,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { SessionStudentTableData } from '~/lib/sessions/types/upcoming-sessions';
import { PAYMENT_STATUS } from '~/lib/student-payments/constant';
import { useRouter } from 'next/navigation';
import { isFirstWeekOfMonth } from '~/lib/utils/date-utils';
import SessionCardActions from './SessionCardActions';

interface StudentNextSessionCardProps {
  sessionData: SessionStudentTableData;
  isPending: boolean;
  setSelectedSession: (session: SessionStudentTableData) => void;
  setShowPaymentDialog: (show: boolean) => void;
  joinMeetingAsStudent: (sessionData: any) => void;
}

const StudentNextSessionCard = ({
  sessionData,
  isPending,
  setSelectedSession,
  setShowPaymentDialog,
  joinMeetingAsStudent,
}: StudentNextSessionCardProps) => {
  const router = useRouter();

  return (
    <Card className="transform transition-all hover:scale-[1.02]">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{sessionData.name}</h3>
            {sessionData.topic ? (
              <p className="text-sm text-gray-600 mt-1">{sessionData.topic}</p>
            ) : (
              <p className="text-sm text-gray-500 italic mt-1">Lesson details will be updated soon</p>
            )}
            <Badge variant="blue" className="mt-2">{sessionData.sessionRawData?.class?.subject}</Badge>
          </div>
          {sessionData.paymentStatus === PAYMENT_STATUS.PENDING_VERIFICATION && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-500">
              Payment pending verification
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="mt-4 space-y-2">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar size={16} className="mr-2" />
            <span>{sessionData.date}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Clock size={16} className="mr-2" />
            <span>{sessionData.time}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <User size={16} className="mr-2" />
            <span>{sessionData.sessionRawData?.class?.tutor?.first_name + ' ' + sessionData.sessionRawData?.class?.tutor?.last_name}</span>
          </div>
        </div>
        {sessionData.paymentStatus === PAYMENT_STATUS.PENDING ? (
          <div className="mt-3">
            <Badge variant="yellow" title={`Please complete the payment of Rs. ${sessionData.paymentAmount} to access the class`}>Rs. {sessionData.paymentAmount} Payment Required </Badge>
          </div>
        ) : sessionData.paymentStatus === PAYMENT_STATUS.PENDING_VERIFICATION ? (
          <div className="mt-3">
            <Badge variant="green" title="Payment is pending for verification from the admin. Please wait for the admin to verify the payment.">Payment pending verification</Badge>
          </div>
        ) : null}
      </CardContent>
      <CardFooter className="border-t border-gray-200 bg-gray-50 p-4">
        <SessionCardActions
          sessionData={sessionData}
          isPending={isPending}
          setSelectedSession={setSelectedSession}
          setShowPaymentDialog={setShowPaymentDialog}
          joinMeetingAsStudent={joinMeetingAsStudent}
        />
      </CardFooter>
    </Card>
  )
};

export default StudentNextSessionCard;