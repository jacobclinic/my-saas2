'use client'

import React from 'react';
import { Card, CardContent } from "../base-v2/ui/Card";
import { Button } from "../base-v2/ui/Button";
import { Badge } from "../base-v2/ui/Badge";
import {
  Video,
  Clock,
  Calendar,
  File,
  DollarSign,
  Camera,
  Download,
} from 'lucide-react';
import { SessionStudentTableData } from '~/lib/sessions/types/upcoming-sessions';
import { PAYMENT_STATUS } from '~/lib/student-payments/constant';
import Link from 'next/link';

interface StudentSessionCardProps {
    sessionData: SessionStudentTableData;
    type: "upcoming" | "past";
    isPending: boolean;
    setSelectedSession: (session: SessionStudentTableData) => void;
    setShowPaymentDialog: (show: boolean) => void;
    joinMeetingAsStudent: (sessionData: any) => void;
}

const StudentSessionCard = ({ 
  sessionData,
  type,
  isPending,
  setSelectedSession,
  setShowPaymentDialog,
  joinMeetingAsStudent,
}: StudentSessionCardProps) => (
    <Card className="mb-4">
      <CardContent className="p-4 space-y-4">
        <div>
          <div className="flex justify-between items-start">
            <div>
              <Link 
                href={`/sessions/student/${sessionData.id}?type=${type}`}
                className="font-medium hover:text-blue-600 hover:underline cursor-pointer"
              >
                {sessionData.name}
              </Link>
              {/* <h3 className="font-medium">{sessionData.name}</h3> */}
              <p className="text-blue-600">{sessionData.topic}</p>
            </div>
            {sessionData.paymentStatus === PAYMENT_STATUS.PENDING && type === "upcoming" && (
              <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100 border-red-500">
                Payment Pending
              </Badge>
            )}
            {sessionData.paymentStatus === PAYMENT_STATUS.PENDING_VERIFICATION && type === "upcoming" && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-500">
                Payment pending verification
              </Badge>
            )}
          </div>
          <div className="flex items-center mt-2 text-gray-600">
            <Calendar className="h-4 w-4 mr-2" />
            {sessionData.date}
          </div>
          <div className="flex items-center mt-1 text-gray-600">
            <Clock className="h-4 w-4 mr-2" />
            {sessionData.time}
          </div>
        </div>

        {sessionData?.materials && sessionData.materials?.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Class Materials</h4>
            <div className="space-y-2">
              {sessionData?.materials?.map((material) => (
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
              {sessionData.paymentStatus === PAYMENT_STATUS.PENDING ? (
                <Button
                  className="bg-red-600 hover:bg-red-700" 
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
            </>
          ) : (
            <>
              <Button onClick={() => window.open(sessionData.recordingUrl, '_blank')}>
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

  export default StudentSessionCard;