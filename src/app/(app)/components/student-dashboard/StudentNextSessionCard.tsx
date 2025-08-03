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

        {/* {sessionData?.materials && sessionData?.materials?.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-blue-900">Class Materials</h4>
            <div className="space-y-2">
              {sessionData?.materials?.map((material) => (
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
        )} */}
      </CardContent>
      <CardFooter className="border-t border-gray-200 bg-gray-50 p-4">
        <div className="flex justify-between gap-2 w-full">
          {isFirstWeekOfMonth(sessionData.date) && (
            <Button
              variant={"primary"}
              className="w-full flex-1"
              onClick={() => joinMeetingAsStudent(sessionData)} disabled={isPending}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Join Class
            </Button>
          )}
          {sessionData.paymentStatus === PAYMENT_STATUS.PENDING ? (
            <Button
              variant={"primary"}
              className="w-[118px] text-sm font-medium"
              onClick={() => {
                setSelectedSession(sessionData);
                setShowPaymentDialog(true);
              }}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Pay Now
            </Button>
          ) : sessionData.paymentStatus === PAYMENT_STATUS.PENDING_VERIFICATION ? (
            null
          ) : (
            <Button
              variant={"primary"}
              className="w-full flex-1"
              onClick={() => joinMeetingAsStudent(sessionData)} disabled={isPending}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Join Class
            </Button>
          )}
          <Button
            variant="outline"
            className='w-full flex-1 gap-1'
            onClick={() =>
              router.push(`/sessions/student/${sessionData.id}?type=next`)
            }>
            <FileText size={16} />
            View Class
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
};

export default StudentNextSessionCard;