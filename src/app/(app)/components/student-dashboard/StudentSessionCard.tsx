'use client';

import React, { useCallback} from 'react';
import { Card, CardContent } from '../base-v2/ui/Card';
import { Button } from '../base-v2/ui/Button';
import { Badge } from '../base-v2/ui/Badge';
import {
  Video,
  Clock,
  Calendar,
  DollarSign,
  Download,
  Book,
  User,
  ExternalLink,
  FileText,
} from 'lucide-react';
import { SessionStudentTableData } from '~/lib/sessions/types/upcoming-sessions';
import { PAYMENT_STATUS } from '~/lib/student-payments/constant';
import { PaymentStatus } from '~/lib/payments/types/admin-payments';
import { Alert, AlertDescription } from '../base-v2/ui/Alert';
import { AlertTriangle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../base-v2/ui/tooltip';
import { useRouter } from 'next/navigation';

interface StudentSessionCardProps {
  sessionData: SessionStudentTableData;
  type: 'upcoming' | 'past';
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
}: StudentSessionCardProps) => {
  const router = useRouter();

  const handleDownloadMaterials = async () => {
    if (!sessionData?.materials || sessionData.materials.length === 0) {
      console.log('No materials available to download');
      return;
    }

    try {
      for (const material of sessionData.materials) {
        // Assuming each material object has a 'url' property with the file location
        if (material.url) {
          const response = await fetch(material.url);
          const blob = await response.blob();
          const downloadUrl = window.URL.createObjectURL(blob);

          // Create a temporary link element to trigger download
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = material.name || `material-${material.id}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(downloadUrl);

          // Add a small delay between downloads to prevent browser blocking
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }
    } catch (error) {
      console.error('Error downloading materials:', error);
      // You might want to add error handling UI here
    }
  };

  const getRecordingUrl = useCallback(
    async (fileName: string): Promise<string> => {
      console.log('Fetching signed URL for:', fileName);
      const response = await fetch(
        `/api/signed-url?fileName=${encodeURIComponent(fileName)}`,
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch signed URL: ${response.statusText}`);
      }
      const data = await response.json();
      return data.signedUrl;
    },
    [],
  );

  return (
    <Card className="mb-4">
      <CardContent className="p-5">
        <div className="flex items-start">
          <div className="mr-4 p-2 bg-blue-100 rounded-lg">
            <Book className="h-5 w-5 text-blue-600" />
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{sessionData.name}</h3>
            {sessionData.topic ? (
              <p className="text-sm text-gray-600 mt-1">{sessionData.topic}</p>
            ) : (
              <p className="text-sm text-gray-500 italic mt-1">Lesson details will be updated soon</p>
            )}
            <Badge variant="blue" className="mt-2">{sessionData.sessionRawData?.class?.subject}</Badge>

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
                <span>{sessionData.sessionRawData?.class?.tutor?.first_name+ ' '+ sessionData.sessionRawData?.class?.tutor?.last_name}</span>
              </div>
            </div>

            {sessionData.paymentStatus === PAYMENT_STATUS.PENDING &&
              type === 'upcoming' && (
                <Badge variant="yellow">Payment Pending</Badge>
              )}
            {sessionData.paymentStatus ===
              PAYMENT_STATUS.PENDING_VERIFICATION &&
              type === 'upcoming' && (
                <Badge variant="yellow">
                  Payment pending verification
                </Badge>
              )}
          </div>
        </div>
      </CardContent>
      <CardContent className="p-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          {type === 'upcoming' ? (
            <>
              <div className='flex items-center gap-2 flex-wrap'>
                {/* Payment button - shown when payment is needed */}
                {(sessionData.paymentStatus === PAYMENT_STATUS.PENDING || 
                  sessionData.paymentStatus === PAYMENT_STATUS.REJECTED) && (
                  <Button
                    variant={sessionData.paymentStatus === PAYMENT_STATUS.REJECTED ? "destructive" : "primary"}
                    onClick={() => {
                      setSelectedSession(sessionData);
                      setShowPaymentDialog(true);
                    }}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    {sessionData.paymentStatus === PAYMENT_STATUS.REJECTED ? "Try Payment Again" : "Make Payment"}
                  </Button>
                )}
                
                {/* Join Class button - always shown for upcoming sessions */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Button 
                          variant={"primary"}
                          className="w-[150px]" 
                          onClick={() => joinMeetingAsStudent(sessionData)} 
                          disabled={isPending || sessionData.paymentStatus !== PaymentStatus.VERIFIED}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Join Class
                        </Button>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      {sessionData.paymentStatus !== PaymentStatus.VERIFIED ? (
                        <p>Please make payment to join the class</p>
                      ) : (
                        <p>Join the class</p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                {/* View Class button - always shown for upcoming sessions */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Button
                          variant={"outline"}
                          className="w-[150px]"
                          disabled={isPending || sessionData.paymentStatus !== PaymentStatus.VERIFIED}
                          onClick={() =>
                            router.push(`/sessions/student/${sessionData.id}?type=${type}`)
                          }
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          View Class
                        </Button>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      {sessionData.paymentStatus !== PaymentStatus.VERIFIED ? (
                        <p>Please make payment to view class details</p>
                      ) : (
                        <p>View class details</p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </>
          ) : (
            <>
              {sessionData.recordingUrl &&
              sessionData.recordingUrl.length > 0 ? (
                sessionData.recordingUrl.map((fileName, index) => (
                  <Button
                    key={index}
                    onClick={async () =>
                      window.open(await getRecordingUrl(fileName), '_blank')
                    }
                    className="flex items-center"
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Watch Recording {index + 1}
                  </Button>
                ))
              ) : (
                <>
                  {sessionData.paymentStatus === PAYMENT_STATUS.VERIFIED ? (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-700">
                        Recording not available for this session.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-700">
                        You have not made the payment to the class
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}
              {sessionData.materials?.[0]?.url && (
                <Button variant="outline" onClick={handleDownloadMaterials}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Materials
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentSessionCard;
