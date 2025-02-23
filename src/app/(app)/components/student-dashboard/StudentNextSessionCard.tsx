'use client'

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../base-v2/ui/Card";
import { Button } from "../base-v2/ui/Button";
import { Badge } from "../base-v2/ui/Badge";
import { Alert, AlertDescription } from "../base-v2/ui/Alert";
import {
  Clock,
  Calendar,
  File,
  DollarSign,
  Camera,
  AlertTriangle,
} from 'lucide-react';
import { SessionStudentTableData } from '~/lib/sessions/types/upcoming-sessions';
import { PAYMENT_STATUS } from '~/lib/student-payments/constant';
import Link from 'next/link';

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
  return (
    <Card className="border-2 border-blue-200 bg-blue-50">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl text-blue-800">Next Class</CardTitle>
            {/* <p className="text-blue-700 font-medium mt-1">{sessionData.name}</p> */}
            <Link 
              href={`/sessions/student/${sessionData.id}?type=next`}
              className="text-blue-700 font-medium mt-1 hover:text-blue-800 hover:underline cursor-pointer"
            >
              {sessionData.name}
            </Link>
          </div>
          {sessionData.paymentStatus === PAYMENT_STATUS.PENDING && (
            <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100 border-red-500">
              Payment Pending
            </Badge>
          )}
          {sessionData.paymentStatus === PAYMENT_STATUS.PENDING_VERIFICATION && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-500">
              Payment pending verification
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="font-medium text-blue-900">{sessionData.topic}</h3>
          <div className="flex items-center text-blue-700">
            <Calendar className="h-4 w-4 mr-2" />
            {sessionData.date}
          </div>
          <div className="flex items-center text-blue-700">
            <Clock className="h-4 w-4 mr-2" />
            {sessionData.time}
          </div>
        </div>

        {sessionData.paymentStatus === PAYMENT_STATUS.PENDING ? (
          <Alert className="border-red-500 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              Please complete the payment of Rs. {sessionData.paymentAmount} to access the class
            </AlertDescription>
          </Alert>
        ) : sessionData.paymentStatus === PAYMENT_STATUS.PENDING_VERIFICATION ? (
          <Alert className="border-yellow-500 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-700">
              Payment is pending for verification from the admin. Please wait for the admin to verify the payment.
            </AlertDescription>
          </Alert>
        ) : null}

        {sessionData?.materials && sessionData?.materials?.length > 0 && (
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
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sessionData.paymentStatus === PAYMENT_STATUS.PENDING ? (
            <Button
              className="w-full bg-red-600 hover:bg-red-700"
              onClick={() => {
                setSelectedSession(sessionData);
                setShowPaymentDialog(true);
              }}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Make Payment
            </Button>
          ) : sessionData.paymentStatus === PAYMENT_STATUS.PENDING_VERIFICATION ? (
            null
          ) : (
            <Button className="w-full" onClick={() => joinMeetingAsStudent(sessionData)} disabled={isPending}>
              <Camera className="h-4 w-4 mr-2" />
              Join Class
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
};

export default StudentNextSessionCard;