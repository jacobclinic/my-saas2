'use client';

import React, { useCallback, useState, useTransition } from 'react';
import {
  LessonDetails,
  UpcommingSessionCardProps,
  UploadedMaterial,
} from '~/lib/sessions/types/upcoming-sessions';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../base-v2/ui/Card';
import { Button } from '../base-v2/ui/Button';
import { Badge } from '../base-v2/ui/Badge';
import { cn } from '../../lib/utils';
import {
  Check,
  Upload,
  Edit,
  Link,
  Clock,
  File,
  Calendar,
  BookOpen,
  PlusCircle,
  Users,
  ExternalLink,
} from 'lucide-react';
import MaterialUploadDialog from './MaterialUploadDialog';
import EditSessionDialog from './EditSessionDialog';
import { joinMeetingAsHost } from '~/lib/zoom/server-actions-v2';
import { updateSessionAction } from '~/lib/sessions/server-actions-v2';
import useCsrfToken from '~/core/hooks/use-csrf-token';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../base-v2/ui/tooltip';
import AddLessonDetailsDialog from './AddLessonDetailsDialog';
import { createShortUrlAction } from '~/lib/short-links/server-actions-v2';

interface TimeRange {
  startTime: string; // e.g., "2025-05-03T06:13:00Z"
  endTime: string; // e.g., "2025-05-03T06:22:00Z"
}

const UpcommingSessionCard: React.FC<UpcommingSessionCardProps> = ({
  sessionData,
  variant = 'default',
}) => {
  const isDashboard = variant === 'dashboard';
  // console.log('sessionData in upcoming session:', sessionData);

  const [linkCopied, setLinkCopied] = useState<{
    student?: boolean;
    materials?: boolean;
  }>({});
  const [isPending, startTransition] = useTransition();

  const [showMaterialDialog, setShowMaterialDialog] = useState(false);
  const [uploadedMaterials, setUploadedMaterials] = useState<
    UploadedMaterial[]
  >([]);
  const [materialDescription, setMaterialDescription] = useState('');
  const [lessonDetails, setLessonDetails] = useState<LessonDetails>({
    title: sessionData?.sessionRawData?.title || '',
    description: sessionData?.sessionRawData?.description || '',
  });

  // Store original lesson details to track changes
  const [originalLessonDetails, setOriginalLessonDetails] =
    useState<LessonDetails>({
      title: sessionData?.sessionRawData?.title || '',
      description: sessionData?.sessionRawData?.description || '',
    });

  const [showEditSessionDialog, setShowSessionEditDialog] = useState(false);
  const [editSessionLoading, setEditSessionLoading] = useState(false);
  const [showLessonDetailsDialog, setShowLessonDetailsDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const csrfToken = useCsrfToken();

  const handleCopyLink = async (
    link: string,
    type: 'student' | 'materials',
  ) => {
    const data = await createShortUrlAction({
      originalUrl: link,
      csrfToken,
    });
    if (data.success && data.shortUrl) {
      navigator.clipboard.writeText(link);
      setLinkCopied({ ...linkCopied, [type]: true });
      setTimeout(() => {
        setLinkCopied({ ...linkCopied, [type]: false });
      }, 2000);
    }
  };

  const joinMeetingAsTutor = useCallback(async () => {
    startTransition(async () => {
      const result = await joinMeetingAsHost({
        meetingId: sessionData?.zoomMeetingId,
      });
      if (result.success) {
        window.open(result.start_url, '_blank');
      } else {
        alert('Failed to generate join link');
      }
    });
  }, [sessionData]);

  const saveLessonDetails = async () => {
    // Save lesson details logic here
    try {
      setLoading(true);
      const result = await updateSessionAction({
        sessionId: sessionData.id,
        sessionData: lessonDetails,
        csrfToken,
      });

      if (result.success) {
        // Update original lesson details to reflect the saved state
        setOriginalLessonDetails({
          title: lessonDetails.title,
          description: lessonDetails.description,
        });
      }
    } catch (error) {
      console.error('Error saving lesson details:', error);
    } finally {
      setLoading(false);
      setShowLessonDetailsDialog(false);
    }
  };
  return (
    <>
      <Card className={cn('mb-6', isDashboard && '')}>
        <CardContent className="p-0">
          <div className="space-y-4">
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
                    {sessionData.subject && (
                      <Badge
                        variant="outline"
                        className="mt-1 bg-primary-blue-50 text-primary-blue-700 border-primary-blue-200"
                      >
                        {sessionData.subject?.replace(/\b([a-z])/, (match) =>
                          match.toUpperCase(),
                        )}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="py-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      {sessionData.registeredStudents} Students
                    </p>
                    <p className="text-xs text-neutral-600">Enrolled</p>
                  </div>
                </div>
              </div>
            </CardContent>
            {/* Lesson Details */}
            <CardContent className="pb-3 py-0">
              <div>
                {!lessonDetails.title ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`pl-0 text-primary-blue-700 hover:text-primary-blue-800 hover:bg-primary-blue-50`}
                    onClick={() => setShowLessonDetailsDialog(true)}
                  >
                    <PlusCircle size={16} className="mr-2" />
                    Add Lesson Details
                  </Button>
                ) : (
                  <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
                    <h3 className="font-medium">{lessonDetails.title}</h3>
                    <p className="text-gray-600 text-sm">
                      {lessonDetails.description}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowLessonDetailsDialog(true)}
                      className="pl-0 text-primary-blue-700 hover:text-primary-blue-800 hover:bg-primary-blue-50"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Details
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>

            {/* Materials Section */}
            {sessionData.materials && sessionData.materials.length > 0 && (
              <div className="border-t px-6 pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium">Class Materials</h4>
                  <Badge variant="outline">
                    {sessionData.materials.length} files
                  </Badge>
                </div>
                <div className="space-y-2 mb-4">
                  {sessionData.materials.map((material) => (
                    <div
                      key={material.id}
                      className="flex items-center justify-between bg-gray-100 p-2 rounded"
                    >
                      <div className="flex items-center">
                        <File className="h-4 w-4 text-blue-600 mr-2" />
                        <span className="text-sm">{material.name}</span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {material.file_size} MB
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <CardFooter className="pt-3 grid grid-cols-2 md:grid-cols-4 gap-2 border-t border-neutral-100">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full bg-primary-blue-50 text-primary-blue-700 hover:bg-primary-blue-100 border border-primary-blue-100 group-hover:bg-primary-blue-100"
                      onClick={joinMeetingAsTutor}
                      disabled={isPending}
                    >
                      <ExternalLink size={16} className="mr-2" />
                      <span>Join Class</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Join the class as a tutor</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full text-neutral-700 hover:bg-neutral-100 border border-neutral-200"
                      onClick={() =>
                        handleCopyLink(
                          `${process.env.NEXT_PUBLIC_SITE_URL}/sessions/student/${sessionData.id}?type=upcoming&sessionId=${sessionData.id}&className=${sessionData.name}&sessionDate=${sessionData.date}&sessionTime=${sessionData.time}&sessionSubject=${sessionData.subject}&sessionTitle=${sessionData.lessonTitle}`,
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
                    <p>Copy student link to clipboard</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      className={`w-full text-neutral-700 hover:bg-neutral-100 border border-neutral-200 ${sessionData.materials && sessionData.materials?.length > 0 ? 'bg-primary-blue-50 border-primary-blue-100' : ''}`}
                      onClick={() => setShowMaterialDialog(true)}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {sessionData.materials?.length
                        ? 'Update Materials'
                        : 'Upload Materials'}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Manage class materials</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full text-neutral-700 hover:bg-neutral-100 border border-neutral-200"
                      onClick={() => setShowSessionEditDialog(true)}
                    >
                      <Edit size={16} className="mr-2" />
                      <span>Edit Session</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Edit class schedule</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardFooter>
          </div>
        </CardContent>
      </Card>

      <MaterialUploadDialog
        showMaterialDialog={showMaterialDialog}
        setShowMaterialDialog={setShowMaterialDialog}
        uploadedMaterials={uploadedMaterials}
        setUploadedMaterials={setUploadedMaterials}
        materialDescription={materialDescription}
        setMaterialDescription={setMaterialDescription}
        sessionId={sessionData.id}
        onSuccess={() => console.log('Material upload success')}
        existingMaterials={sessionData.materials || []}
      />
      <EditSessionDialog
        open={showEditSessionDialog}
        onClose={() => setShowSessionEditDialog(false)}
        sessionId={sessionData.id}
        sessionData={{
          title: sessionData.lessonTitle || '',
          description: sessionData.lessonDescription || '',
          startTime: sessionData.start_time || '',
          endTime: sessionData.end_time || '',
          meetingUrl: sessionData.zoomLinkStudent || '',
          materials: sessionData.materials || [],
        }}
        loading={editSessionLoading}
      />
      <AddLessonDetailsDialog
        open={showLessonDetailsDialog}
        onClose={() => {
          // Reset to the last saved state, not the original session data
          setLessonDetails({
            title: originalLessonDetails.title,
            description: originalLessonDetails.description,
          });
          setShowLessonDetailsDialog(false);
        }}
        lessonDetails={lessonDetails}
        setLessonDetails={setLessonDetails}
        onConfirm={saveLessonDetails}
        loading={loading}
        originalLessonDetails={originalLessonDetails}
      />
    </>
  );
};

export default UpcommingSessionCard;
