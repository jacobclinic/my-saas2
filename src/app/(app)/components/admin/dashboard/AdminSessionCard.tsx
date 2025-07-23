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
} from '../../base-v2/ui/Card';
import { Button } from '../../base-v2/ui/Button';
import { Badge } from '../../base-v2/ui/Badge';
import { Textarea } from '../../base-v2/ui/Textarea';
import { Input } from '../../base-v2/ui/Input';
import { cn } from '../../../lib/utils';
import {
  Camera,
  Copy,
  Check,
  Upload,
  Edit,
  Plus,
  Link,
  Clock,
  File,
  Save,
  Calendar,
  User,
  BookOpen,
  Users,
  PlusCircle,
  ExternalLink,
} from 'lucide-react';
import MaterialUploadDialog from '../../upcoming-sessions/MaterialUploadDialog';
import EditSessionDialog from '../../upcoming-sessions/EditSessionDialog';
import { joinMeetingAsHost } from '~/lib/zoom/server-actions-v2';
import { updateSessionAction } from '~/lib/sessions/server-actions-v2';
import useCsrfToken from '~/core/hooks/use-csrf-token';
import { useToast } from '~/app/(app)/lib/hooks/use-toast';
import { convertTimeRangeToISO } from '~/lib/utils/date-utils';
import AddLessonDetailsDialog from '../../upcoming-sessions/AddLessonDetailsDialog';

const AdminSessionCard: React.FC<UpcommingSessionCardProps> = ({
  sessionData,
  variant = 'default',
}) => {
  const isDashboard = variant === 'dashboard';
  const csrfToken = useCsrfToken();
  const { toast } = useToast();

  const [linkCopied, setLinkCopied] = useState<{
    student?: boolean;
    materials?: boolean;
    tutor?: boolean;
  }>({});
  const [isPending, startTransition] = useTransition();

  const [showMaterialDialog, setShowMaterialDialog] = useState(false);
  const [uploadedMaterials, setUploadedMaterials] = useState<
    UploadedMaterial[]
  >([]);
  const [materialDescription, setMaterialDescription] = useState('');
  const [lessonDetails, setLessonDetails] = useState<LessonDetails>({
    title: sessionData.lessonTitle || '',
    description: sessionData.lessonDescription || '',
  });

  // Store original lesson details to track changes
  const [originalLessonDetails, setOriginalLessonDetails] =
    useState<LessonDetails>({
      title: sessionData.lessonTitle || '',
      description: sessionData.lessonDescription || '',
    });

  const [showEditSessionDialog, setShowSessionEditDialog] = useState(false);
  const [editSessionLoading, setEditSessionLoading] = useState(false);
  const [showLessonDetailsDialog, setShowLessonDetailsDialog] = useState(false);
  const saveLessonDetails = async () => {
    setEditSessionLoading(true);
    const result = await updateSessionAction({
      sessionId: sessionData.id,
      sessionData: lessonDetails,
      csrfToken,
    });

    if (result.success) {
      toast({
        title: 'Success',
        description: 'Session edited successfully',
        variant: 'success',
      });
      // Update original lesson details to reflect the saved state
      setOriginalLessonDetails({
        title: lessonDetails.title,
        description: lessonDetails.description,
      });
    } else {
      toast({
        title: 'Error',
        description: 'Failed to edit session',
        variant: 'destructive',
      });
    }
    setEditSessionLoading(false);
    setShowLessonDetailsDialog(false);
  };

  const handleCopyLink = (
    link: string,
    type: 'student' | 'materials' | 'tutor',
  ) => {
    navigator.clipboard.writeText(link);
    setLinkCopied({ ...linkCopied, [type]: true });
    setTimeout(() => {
      setLinkCopied({ ...linkCopied, [type]: false });
    }, 2000);
  };

  const copyTutorLink = useCallback(async () => {
    startTransition(async () => {
      const result = await joinMeetingAsHost({
        meetingId: sessionData?.zoomMeetingId,
      });
      if (result.success) {
        handleCopyLink(result.start_url, 'tutor');
      } else {
        alert('Failed to generate join link');
      }
    });
  }, [sessionData]);
  return (
    <>
      <Card className={cn('mb-6', isDashboard && '')}>
        <CardContent className="p-0">
          <div className="space-y-4">
            {/* Header */}
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
                    <div className="mt-1 flex items-center gap-2 text-sm">
                      {sessionData.subject && (
                        <Badge
                          variant="outline"
                          className="bg-primary-blue-50 text-primary-blue-700 border-primary-blue-200"
                        >
                          {sessionData.subject?.replace(/\b([a-z])/, (match) =>
                            match.toUpperCase(),
                          )}
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className="flex items-center text-gray-900"
                      >
                        <User className="h-4 w-4 mr-2" />
                        <span>
                          Tutor:{' '}
                          {sessionData.sessionRawData?.class?.tutor?.first_name}{' '}
                          {sessionData.sessionRawData?.class?.tutor?.last_name}
                        </span>
                      </Badge>
                    </div>
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
                    onClick={() => setShowLessonDetailsDialog(true)}
                    className={`pl-0 text-primary-blue-700 hover:text-primary-blue-800 hover:bg-primary-blue-50`}
                  >
                    <PlusCircle size={16} className="mr-2" />
                    Add Lesson Details
                  </Button>
                ) : (
                  <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
                    <h3 className="text-lg font-medium">
                      {lessonDetails.title}
                    </h3>
                    <p className="text-gray-600">{lessonDetails.description}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowLessonDetailsDialog(true)}
                      className={`pl-0 text-primary-blue-700 hover:text-primary-blue-800 hover:bg-primary-blue-50`}
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

            {/* Actions */}
            <CardFooter className="pt-3 grid grid-cols-2 md:grid-cols-4 gap-2 border-t border-neutral-100">
              <Button
                variant="ghost"
                className="w-full bg-primary-blue-50 text-primary-blue-700 hover:bg-primary-blue-100 border border-primary-blue-100 group-hover:bg-primary-blue-100"
                onClick={copyTutorLink}
                disabled={isPending}
              >
                {' '}
                {linkCopied.tutor ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <Link className="h-4 w-4 mr-2" />
                )}
                {linkCopied.tutor ? 'Copied!' : 'Copy Tutor Link'}
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  handleCopyLink(
                    `${process.env.NEXT_PUBLIC_SITE_URL}/sessions/student/${sessionData.id}?type=upcoming&redirectUrl=${encodeURIComponent(`${process.env.NEXT_PUBLIC_SITE_URL}/sessions/student/${sessionData.id}?type=upcoming&sessionId=${sessionData.id}&className=${sessionData.name}&sessionDate=${sessionData.date}&sessionTime=${sessionData.time}&sessionSubject=${sessionData.subject}&sessionTitle=${sessionData.lessonTitle}`)}`,
                    'student',
                  )
                }
                className="w-full bg-primary-blue-50 text-primary-blue-700 hover:bg-primary-blue-100 border border-primary-blue-100 group-hover:bg-primary-blue-100"
              >
                {' '}
                {linkCopied.student ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <Link className="h-4 w-4 mr-2" />
                )}
                {linkCopied.student ? 'Copied!' : 'Copy Student Link'}
              </Button>

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

              <Button
                variant="outline"
                onClick={() => setShowSessionEditDialog(true)}
                className="w-full text-neutral-700 hover:bg-neutral-100 border border-neutral-200"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Class
              </Button>

              {/* {sessionData.materials && sessionData.materials.length > 0 && (
                <Button
                  variant="outline"
                  className="md:col-span-4"
                  onClick={() => {
                    const materialsText =
                      `Class Materials for ${sessionData.name} - ${sessionData.date}\n\n` +
                      (sessionData.materials || [])
                        .map(
                          (material, index) =>
                            `${index + 1}. ${material.name}\nDownload: https://commaeducation.com/materials/${sessionData.id}/${material.id}\n`,
                        )
                        .join('\n');
                    handleCopyLink(materialsText, 'materials');
                  }}
                >
                  {linkCopied.materials ? (
                    <Check className="h-4 w-4 mr-2" />
                  ) : (
                    <Copy className="h-4 w-4 mr-2" />
                  )}
                  {linkCopied.materials ? 'Materials Links Copied!' : 'Copy Materials Links'}
                </Button>
              )} */}
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
          title: sessionData?.sessionRawData?.title || '',
          description: sessionData?.sessionRawData?.description || '',
          startTime: sessionData.start_time || '',
          endTime: sessionData.end_time || '',
          meetingUrl: sessionData?.sessionRawData?.meeting_url || '',
          materials: sessionData?.materials || [],
        }}
        loading={editSessionLoading}
      />{' '}
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
        loading={editSessionLoading}
        originalLessonDetails={originalLessonDetails}
      />
    </>
  );
};

export default AdminSessionCard;
