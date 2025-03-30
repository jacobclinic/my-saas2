'use client';

import React, { useState } from 'react';
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

  return (
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
              <p className="text-blue-600">{sessionData.topic}</p>
            </div>
            {sessionData.paymentStatus === PAYMENT_STATUS.PENDING &&
              type === 'upcoming' && (
                <Badge
                  variant="destructive"
                  className="bg-red-100 text-red-700 hover:bg-red-100 border-red-500"
                >
                  Payment Pending
                </Badge>
              )}
            {sessionData.paymentStatus ===
              PAYMENT_STATUS.PENDING_VERIFICATION &&
              type === 'upcoming' && (
                <Badge
                  variant="secondary"
                  className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-500"
                >
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
                PAYMENT_STATUS.PENDING_VERIFICATION ? null : (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full" disabled={isPending}>
                      View Class
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{sessionData.name}</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 py-4">
                      <Button
                        onClick={() => {
                          joinMeetingAsStudent(sessionData);
                          setIsDialogOpen(false);
                        }}
                        disabled={isPending}
                      >
                        <Video className="h-4 w-4 mr-2" />
                        Join Class
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleDownloadMaterials}
                        disabled={
                          !sessionData?.materials ||
                          sessionData.materials.length === 0
                        }
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Class Materials
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </>
          ) : (
            <>
              <Button
                onClick={() => window.open(sessionData.recordingUrl, '_blank')}
              >
                <Video className="h-4 w-4 mr-2" />
                Watch Recording
              </Button>
              <Button variant="outline" onClick={handleDownloadMaterials}>
                <Download className="h-4 w-4 mr-2" />
                Download Materials
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentSessionCard;
