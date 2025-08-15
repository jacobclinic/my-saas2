'use client';

import React, { useCallback, useState } from 'react';
import type { PastSessionsCardProps } from '~/lib/sessions/types/past-sessions';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../base-v2/ui/Card';
import { Button } from '../base-v2/ui/Button';
import { Badge } from '../base-v2/ui/Badge';
import {
  Video,
  Users,
  Check,
  Calendar,
  Clock,
  Link,
  UserCheck,
  BookOpen,
} from 'lucide-react';
import AttendanceDialog from './AttendanceDialog';
import {
  getAttendanceAction,
  updateAttendanceMarkedAction,
} from '~/lib/sessions/server-actions-v2';
import { Attendance, ZoomParticipant } from '~/lib/zoom/types/zoom.types';
import { insertAttendanceAction } from '~/lib/attendance/server-actions';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../base-v2/ui/tooltip';
import useCsrfToken from '~/core/hooks/use-csrf-token';
import { copyToClipboard } from '~/lib/utils/clipboard';
import { createShortUrlAction } from '~/lib/short-links/server-actions-v2';

const PastSessionsCard: React.FC<PastSessionsCardProps> = ({ sessionData }) => {
  const [showAttendanceDialog, setShowAttendanceDialog] = useState(false);
  const [attendanceData, setAttendanceData] = useState<Attendance[]>([]);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [linkCopied, setLinkCopied] = useState<{
    recordings?: boolean;
    materials?: boolean;
    allMaterials?: boolean;
    student?: boolean;
  }>({});
  const csrfToken = useCsrfToken();

  const handleCopyLink = async (
    link: string,
    type: 'recordings' | 'materials' | 'allMaterials' | 'student',
  ) => {
    const data = await createShortUrlAction({
      originalUrl: link
    });
    if (data.success && data.shortUrl) {
      await copyToClipboard(data.shortUrl);
      setLinkCopied({ ...linkCopied, [type]: true });
      setTimeout(() => {
        setLinkCopied({ ...linkCopied, [type]: false });
      }, 2000);
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

  const zoomMeetingId = sessionData.zoom_meeting_id;
  const sessionId = sessionData.id;
  const classId = sessionData.classId;

  const getAttendance = async (): Promise<void> => {
    if (sessionData.attendance_marked) {
      setAttendanceData(sessionData.attendance!);
      setShowAttendanceDialog(true);
      return;
    } else if (attendanceMarked) {
      setShowAttendanceDialog(true);
      return;
    } else {
      const result = await getAttendanceAction({
        zoomMeetingId,
        classId,
      });
      const formattedData = result.attendance.map(
        (student: ZoomParticipant) => ({
          time: String(student.duration),
          name: student.name,
          email: student.email,
          join_time: student.join_time,
          leave_time: student.leave_time,
        }),
      );
      setAttendanceData(formattedData);
      setAttendanceMarked(true);
      setShowAttendanceDialog(true);
      if (formattedData.length === 0) {
        return;
      }

      const insertAttendanceData = formattedData.map((student) => ({
        ...student,
        sessionId: sessionId,
      }));
      try {
        await insertAttendanceAction(insertAttendanceData);
      } catch (error) {
        console.error('Error inserting attendance:', error);
        return;
      }
      // Update the session to mark attendance as true
      try {
        const response = await updateAttendanceMarkedAction(sessionId);
        if (response.success) {
          console.log('Attendance marked successfully');
        } else {
          console.error('Failed to mark attendance:', response.error);
        }
      } catch (error) {
        console.error('Error updating attendance marked:', error);
      }
    }
  };

  return (
    <>
      <Card className="group bg-white border-neutral-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
        <CardHeader className="pb-3 border-b border-neutral-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-blue-50 text-primary-blue-600">
                <BookOpen size={20} />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-neutral-900">
                  {sessionData.name}
                </CardTitle>
                {sessionData.topic ? (
                  <Badge
                    variant="outline"
                    className="mt-1 bg-primary-blue-50 text-primary-blue-700 border-primary-blue-200"
                  >
                    {sessionData.topic}
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4 pb-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50">
              <Calendar size={18} className="text-primary-blue-600" />
              <div>
                <p className="text-sm font-medium text-neutral-900">
                  {sessionData.date}
                </p>
                <p className="text-xs text-neutral-600">Date</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50">
              <Clock size={18} className="text-primary-blue-600" />
              <div>
                <p className="text-sm font-medium text-neutral-900">
                  {sessionData.time}
                </p>
                <p className="text-xs text-neutral-600">Time</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50">
              <Users size={18} className="text-primary-blue-600" />
              <div>
                <p className="text-sm font-medium text-neutral-900">
                  {sessionData.noOfStudents} Students
                </p>
                <p className="text-xs text-neutral-600">Total</p>
              </div>
            </div>

            {sessionData.noOfStudents > 0 && sessionData.attendance ? (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50">
                <UserCheck size={18} className="text-primary-blue-600" />
                <div>
                  <p className="text-sm font-medium text-neutral-900">
                    {sessionData.attendance?.length} Attended
                  </p>
                  <p className="text-xs text-neutral-600">
                    {Math.round(
                      (sessionData.attendance?.length /
                        sessionData.noOfStudents) *
                        100,
                    )}
                    % Attendance
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </CardContent>

        <CardFooter className="pt-3 grid grid-cols-2 md:grid-cols-3 gap-2 border-t border-neutral-100">
          {sessionData.recordingUrl && sessionData.recordingUrl.length > 0 ? (
            sessionData.recordingUrl.map((fileName, index) => (
              <Button
                key={index}
                onClick={async () =>
                  window.open(await getRecordingUrl(fileName), '_blank')
                }
                className="w-full text-neutral-700 hover:bg-neutral-100 border border-neutral-200"
              >
                <Video className="h-4 w-4 mr-2" />
                View Recording {index + 1}
              </Button>
            ))
          ) : (
            <Button variant="outline">
              <Video className="h-4 w-4 mr-2" />
              No recordings available
            </Button>
          )}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full text-neutral-700 hover:bg-neutral-100 border border-neutral-200"
                  onClick={() =>
                    handleCopyLink(
                      `${process.env.NEXT_PUBLIC_SITE_URL}/sessions/student/${sessionData.id}?type=upcoming&sessionId=${sessionData.id}&className=${sessionData.name}&sessionSubject=${sessionData.subject}&sessionTitle=${sessionData.topic}`,
                      'student',
                    )
                  }
                >
                  {' '}
                  {linkCopied.student ? (
                    <Check className="h-4 w-4 mr-2" />
                  ) : (
                    <Link className="h-4 w-4 mr-2" />
                  )}
                  {linkCopied.student ? 'Copied!' : 'Copy Student Link'}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy class link to clipboard</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className={`w-full text-neutral-700 hover:bg-neutral-100 border border-neutral-200`}
                  onClick={() => {
                    getAttendance();
                  }}
                >
                  <UserCheck size={16} className="mr-2" />
                  <span>Attendance</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View attendance details</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardFooter>
      </Card>

      <AttendanceDialog
        showAttendanceDialog={showAttendanceDialog}
        setShowAttendanceDialog={setShowAttendanceDialog}
        selectedSession={sessionData}
        attendance={attendanceData}
      />
    </>
  );
};

export default PastSessionsCard;
