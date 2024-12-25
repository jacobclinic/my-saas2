'use client'

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../base-v2/ui/Card";
import { Button } from "../base-v2/ui/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../base-v2/ui/Dialog";
import { Badge } from "../base-v2/ui/Badge";
import { Alert, AlertDescription } from "../base-v2/ui/Alert";
import { Info } from 'lucide-react';
import { UpcomingSessionTableData, UploadedMaterial } from '~/lib/sessions/types/upcoming-sessions';
import UpcommingSessionClassCard from '../upcoming-sessions/UpcommingSessionCard';
import ClassCard from '../classes/ClassCard';
import { ClassListData, NewStudentData } from '~/lib/classes/types/class-v2';

const TutorDashboard = () => {
  const [linkCopied, setLinkCopied] = useState({});

  const nextSession: UpcomingSessionTableData = {
    id: 1,
    name: "2025 A-Levels Batch 1",
    subject: "Accounting",
    date: "Monday, Dec 18, 2024",
    time: "4:00 PM - 6:00 PM",
    registeredStudents: 25,
    zoomLinkTutor: "https://zoom.us/j/123456789",
    zoomLinkStudent: "https://zoom.us/j/987654321",
    materials: [
      { id: 1, name: "Chapter 5 - Manufacturing Accounts Notes.pdf", size: "2.5" },
      { id: 2, name: "Practice Problems Set.pdf", size: "1.8" }
    ]
  };

  const activeClasses: ClassListData[] = [
    {
      id: 2,
      name: "2025 A-Levels Batch 1",
      schedule: "Every Monday, 4:00 PM",
      students: 25,
      registrationLink: "https://commaeducation.com/class/register/123"
    },
    {
      id: 3,
      name: "2024 A-Levels Revision Batch 2",
      schedule: "Every Wednesday, 2:00 PM",
      students: 18,
      registrationLink: "https://commaeducation.com/class/register/456"
    }
  ];

  const handleCopyLink = (id: number, link: string, type?: string) => {
    navigator.clipboard.writeText(link);
    setLinkCopied({ ...linkCopied, [type ? `${type}-${id}` : id]: true });
    setTimeout(() => {
      setLinkCopied({ ...linkCopied, [type ? `${type}-${id}` : id]: false });
    }, 2000);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Quick Actions Alert */}
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-700">
          Quick tip: Upload class materials before the session starts to ensure students are prepared.
        </AlertDescription>
      </Alert>

      {/* Next Class */}
      <div className="space-y-2">
        <div className="flex items-center">
          <Info className="h-5 w-5 mr-2" />
          <h2 className="text-xl font-bold">Upcoming Class</h2>
        </div>
        <UpcommingSessionClassCard
          sessionData={nextSession}
          linkCopied={linkCopied}
          handleCopyLink={handleCopyLink}
          variant="dashboard"
        />
      </div>

      {/* Active Classes */}
      <div className="space-y-4">
        <div className="flex items-center">
          <Info className="h-5 w-5 mr-2" />
          <h2 className="text-xl font-bold">Active Classes</h2>
        </div>
        <div>
          {activeClasses.map(classData => (
            <ClassCard
              key={classData.id}
              classData={classData}
              linkCopied={linkCopied}
              onCopyLink={handleCopyLink}
              variant="dashboard"
              showViewDetails={false}
            />
          ))}
        </div>
      </div>

      {/* Tutorial Video */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use the Platform</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-gray-100 rounded-lg">
            <iframe
              className="w-full h-full rounded-lg"
              src="/api/placeholder/800/450"
              title="Platform Tutorial"
              allowFullScreen
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TutorDashboard;