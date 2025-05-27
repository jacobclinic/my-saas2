'use client';

import React, { useCallback, useState } from 'react';
import { Card, CardContent } from '../base-v2/ui/Card';
import { Button } from '../base-v2/ui/Button';
import { Badge } from '../base-v2/ui/Badge';
import {
  Video,
  Clock,
  Calendar,
  File,
  DollarSign,
  Camera,
  Download,
  BookOpen,
  Book,
  User,
} from 'lucide-react';
import { SessionStudentTableData } from '~/lib/sessions/types/upcoming-sessions';
import { PAYMENT_STATUS } from '~/lib/student-payments/constant';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../base-v2/ui/Dialog';
import { Alert, AlertDescription } from '../base-v2/ui/Alert';
import { AlertTriangle } from 'lucide-react';
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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

    setIsDialogOpen(false);
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
            <Badge variant="blue" className="mt-2">{"Subject Name"}</Badge>

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
                <span>{"Tutor Name"}</span>
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
                  <span className="text-sm text-gray-600">
                    {material.file_size}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {type === 'upcoming' ? (
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
              ) : sessionData.paymentStatus ===
                PAYMENT_STATUS.PENDING_VERIFICATION ? null : sessionData.paymentStatus ===
                  PAYMENT_STATUS.REJECTED ? (
                <Button
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => {
                    setSelectedSession(sessionData);
                    setShowPaymentDialog(true);
                  }}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Try The Payment Again
                </Button>
              ) : (
                // <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                //   <DialogTrigger asChild>
                //     <Button className="w-full" disabled={isPending}>
                //       View Class
                //     </Button>
                //   </DialogTrigger>
                //   <DialogContent>
                //     <DialogHeader>
                //       <DialogTitle>{sessionData.name}</DialogTitle>
                //     </DialogHeader>
                //     <div className="flex flex-col gap-4 py-4">
                //       <Button
                //         onClick={() => {
                //           joinMeetingAsStudent(sessionData);
                //           setIsDialogOpen(false);
                //         }}
                //         disabled={isPending}
                //       >
                //         <Video className="h-4 w-4 mr-2" />
                //         Join Class
                //       </Button>
                //       <Button
                //         variant="outline"
                //         onClick={handleDownloadMaterials}
                //         disabled={
                //           !sessionData?.materials ||
                //           sessionData.materials.length === 0
                //         }
                //       >
                //         <Download className="h-4 w-4 mr-2" />
                //         Download Class Materials
                //       </Button>
                //     </div>
                //   </DialogContent>
                // </Dialog>
                <Button
                  className="w-full"
                  disabled={isPending}
                  onClick={() =>
                    router.push(`/sessions/student/${sessionData.id}?type=${type}`)
                  }
                >
                  View Class
                </Button>
              )}
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
