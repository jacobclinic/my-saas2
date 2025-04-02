'use client';

import React, { useCallback, useState, useTransition } from 'react';
import {
  LessonDetails,
  UpcommingSessionCardProps,
  UploadedMaterial,
} from '~/lib/sessions/types/upcoming-sessions';
import { Card, CardContent, CardHeader, CardTitle } from '../base-v2/ui/Card';
import { Button } from '../base-v2/ui/Button';
import { Badge } from '../base-v2/ui/Badge';
import { Textarea } from '../base-v2/ui/Textarea';
import { Input } from '../base-v2/ui/Input';
import { cn } from '../../lib/utils';
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
} from 'lucide-react';
import MaterialUploadDialog from './MaterialUploadDialog';
import EditSessionDialog from './EditSessionDialog';
import { joinMeetingAsHost } from '~/lib/zoom/server-actions-v2';

const UpcommingSessionCard: React.FC<UpcommingSessionCardProps> = ({
  sessionData,
  variant = 'default',
}) => {
  const isDashboard = variant === 'dashboard';

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
  const [iseditingLesson, setIsEditingLesson] = useState(false);

  const [showEditSessionDialog, setShowSessionEditDialog] = useState(false);
  const [editSessionLoading, setEditSessionLoading] = useState(false);

  const handleCopyLink = (link: string, type: 'student' | 'materials') => {
    navigator.clipboard.writeText(link);
    setLinkCopied({ ...linkCopied, [type]: true });
    setTimeout(() => {
      setLinkCopied({ ...linkCopied, [type]: false });
    }, 2000);
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
  return (
    <>
      <Card
        className={cn('mb-6', isDashboard && 'border-green-200 bg-green-50')}
      >
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center space-x-2">
                  <h2
                    className={cn(
                      'text-xl font-semibold',
                      isDashboard && 'text-green-800',
                    )}
                  >
                    {sessionData.name}
                  </h2>
                  {sessionData.subject && (
                    <Badge variant="secondary">
                      {sessionData.subject?.replace(/\b([a-z])/, (match) =>
                        match.toUpperCase(),
                      )}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center mt-2 text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>{sessionData.date}</span>
                </div>
                <div className="flex items-center mt-1 text-gray-600">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>{sessionData.time}</span>
                </div>
                <Badge variant="outline" className="mt-2">
                  {sessionData.registeredStudents} Students
                </Badge>
              </div>
            </div>

            {/* Lesson Details */}
            <div>
              {iseditingLesson ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lesson Title
                    </label>
                    <Input
                      value={lessonDetails?.title || ''}
                      onChange={(e) =>
                        setLessonDetails({
                          ...lessonDetails,
                          title: e.target.value,
                        })
                      }
                      placeholder="Enter the lesson title..."
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lesson Description
                    </label>
                    <Textarea
                      value={lessonDetails?.description || ''}
                      onChange={(e) =>
                        setLessonDetails({
                          ...lessonDetails,
                          description: e.target.value,
                        })
                      }
                      placeholder="Enter the lesson description..."
                      className="w-full"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        console.log('Saving lesson details:', lessonDetails);
                        setIsEditingLesson(false);
                      }}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Details
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditingLesson(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  {!lessonDetails.title ? (
                    <Button
                      variant="outline"
                      onClick={() => setIsEditingLesson(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Lesson Details
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">
                        {lessonDetails.title}
                      </h3>
                      <p className="text-gray-600">
                        {lessonDetails.description}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditingLesson(true)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Details
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Materials Section */}
            {sessionData.materials && sessionData.materials.length > 0 && (
              <div className="border-t pt-4">
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button onClick={joinMeetingAsTutor} disabled={isPending}>
                <Camera className="h-4 w-4 mr-2" />
                Join as Tutor
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  handleCopyLink(
                    `${process.env.NEXT_PUBLIC_SITE_URL}/sessions/student/${sessionData.id}?type=upcoming&redirectUrl=${encodeURIComponent(`${process.env.NEXT_PUBLIC_SITE_URL}/sessions/student/${sessionData.id}?type=upcoming&sessionId=${sessionData.id}&className=${sessionData.name}&sessionDate=${sessionData.date}&sessionTime=${sessionData.time}&sessionSubject=${sessionData.subject}&sessionTitle=${sessionData.lessonTitle}`)}`,
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

              <Button
                variant="outline"
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
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Class
              </Button>

              {sessionData.materials && sessionData.materials.length > 0 && (
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
                  {/* {linkCopied.materials ? (
                    <Check className="h-4 w-4 mr-2" />
                  ) : (
                    <Copy className="h-4 w-4 mr-2" />
                  )}
                  {linkCopied.materials ? 'Materials Links Copied!' : 'Copy Materials Links'} */}
                </Button>
              )}
            </div>
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
          startTime: sessionData?.sessionRawData?.start_time || '',
          endTime: sessionData?.sessionRawData?.end_time || '',
          meetingUrl: sessionData?.sessionRawData?.meeting_url || '',
          materials: sessionData?.materials || [],
        }}
        loading={editSessionLoading}
      />
    </>
  );
};

export default UpcommingSessionCard;
