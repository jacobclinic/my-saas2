'use client'

import React, { useState } from 'react';
import type { PastSessionsCardProps } from '~/lib/sessions/types/past-sessions';
import { Card, CardContent } from "../base-v2/ui/Card";
import { Button } from "../base-v2/ui/Button";
import { Badge } from "../base-v2/ui/Badge";
import {
  Video,
  Users,
  Copy,
  Check,
  Calendar,
  Clock,
  Link2,
  File
} from 'lucide-react';
import AttendanceDialog from './AttendanceDialog';

const PastSessionsCard: React.FC<PastSessionsCardProps> = ({
  sessionData,
}) => {
  const [showAttendanceDialog, setShowAttendanceDialog] = useState(false);
  const [linkCopied, setLinkCopied] = useState<{
    recordings?: boolean;
    materials?: boolean;
    allMaterials?: boolean;
  }>({});
  
  const handleCopyLink = (link: string, type: 'recordings' | 'materials' | 'allMaterials') => {
    navigator.clipboard.writeText(link);
    setLinkCopied({ ...linkCopied, [type]: true });
    setTimeout(() => {
      setLinkCopied({ ...linkCopied, [type]: false });
    }, 2000);
  };
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
                  <p className="text-blue-600 font-medium">{sessionData.topic}</p>
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

            {/* Materials Section */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Class Materials</h4>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const message = `Class Materials - ${sessionData.name} (${sessionData.date})\n\n` +
                        sessionData.materials.map(material => 
                          `${material.name}\n${material.url}`
                        ).join('\n\n');
                      handleCopyLink(message, 'allMaterials');
                    }}
                  >
                    {linkCopied.allMaterials ? (
                      <Check className="h-4 w-4 mr-2" />
                    ) : (
                      <Copy className="h-4 w-4 mr-2" />
                    )}
                    {linkCopied.allMaterials ? 'All Links Copied!' : 'Copy All Material Links'}
                  </Button>
                  <Badge variant="outline">{sessionData.materials.length} files</Badge>
                </div>
              </div>
              <div className="space-y-2">
                {sessionData.materials.map((material) => (
                  <div key={material.id} 
                    className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                  >
                    <div className="flex items-center">
                      <File className="h-4 w-4 text-blue-600 mr-2" />
                      <div>
                        <p className="font-medium">{material.name}</p>
                        <p className="text-sm text-gray-600">{material.file_size}</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyLink(material.url, 'materials')}
                    >
                      {linkCopied.materials ? (
                        <Check className="h-4 w-4 mr-2" />
                      ) : (
                        <Link2 className="h-4 w-4 mr-2" />
                      )}
                      {linkCopied.materials ? 'Copied!' : 'Copy Link'}
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button onClick={() => window.open(sessionData.recordingUrl, '_blank')}>
                <Video className="h-4 w-4 mr-2" />
                View Recording
              </Button>
              
              <Button variant="outline"
                onClick={() => handleCopyLink(sessionData.recordingUrl, 'recordings')}
              >
                {linkCopied.recordings ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <Link2 className="h-4 w-4 mr-2" />
                )}
                {linkCopied.recordings ? 'Copied!' : 'Copy Recording Link'}
              </Button>

              <Button variant="outline" onClick={() => setShowAttendanceDialog(true)}>
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