'use client';

import React, { useCallback, useState } from 'react';
import type { PastSessionsCardProps } from '~/lib/sessions/types/past-sessions';
import { Card, CardContent } from '../base-v2/ui/Card';
import { Button } from '../base-v2/ui/Button';
import { Badge } from '../base-v2/ui/Badge';
import {
  Video,
  Users,
  Copy,
  Check,
  Calendar,
  Clock,
  Link2,
  File,
} from 'lucide-react';
import AttendanceDialog from './AttendanceDialog';
import { getSignedUrl } from '~/lib/aws/s3.service';

const PastSessionsCard: React.FC<PastSessionsCardProps> = ({ sessionData }) => {
  const [showAttendanceDialog, setShowAttendanceDialog] = useState(false);
  const [linkCopied, setLinkCopied] = useState<{
    recordings?: boolean;
    materials?: boolean;
    allMaterials?: boolean;
  }>({});

  const handleCopyLink = (
    link: string,
    type: 'recordings' | 'materials' | 'allMaterials',
  ) => {
    navigator.clipboard.writeText(link);
    setLinkCopied({ ...linkCopied, [type]: true });
    setTimeout(() => {
      setLinkCopied({ ...linkCopied, [type]: false });
    }, 2000);
  };

  const getRecordingUrl = useCallback(async (fileName: string): Promise<string> => {
    console.log('Fetching signed URL for:', fileName);
    const response = await fetch(`/api/signed-url?fileName=${encodeURIComponent(fileName)}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch signed URL: ${response.statusText}`);
    }
    const data = await response.json();
    return data.signedUrl;
  }, []);
  return (
    <>
      <Card className="mb-4">
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div>
                  <h3 className="text-xl font-semibold">{sessionData.name}</h3>
                  <p className="text-blue-600 font-medium">
                    {sessionData.topic}
                  </p>
                </div>
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  {sessionData.date}
                </div>
                <div className="flex items-center text-gray-600">
                  <Clock className="h-4 w-4 mr-2" />
                  {sessionData.time}
                </div>
                <Badge variant="outline">
                  {sessionData.attendance.length} Students Attended
                </Badge>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                    View Recording {index + 1}
                  </Button>
                ))
              ) : (
                <p>No recordings available</p>
              )}

              {/* <Button
                variant="outline"
                onClick={() =>
                  handleCopyLink(sessionData.recordingUrl, 'recordings')
                }
              >
                {linkCopied.recordings ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <Link2 className="h-4 w-4 mr-2" />
                )}
                {linkCopied.recordings ? 'Copied!' : 'Copy Student Link'}
              </Button> */}

              <Button
                variant="outline"
                onClick={() => setShowAttendanceDialog(true)}
              >
                <Users className="h-4 w-4 mr-2" />
                View Attendance
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AttendanceDialog
        showAttendanceDialog={showAttendanceDialog}
        setShowAttendanceDialog={setShowAttendanceDialog}
        selectedSession={sessionData}
      />
    </>
  );
};

export default PastSessionsCard;
