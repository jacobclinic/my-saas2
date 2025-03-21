'use client'

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../base-v2/ui/Card";
import { Button } from "../base-v2/ui/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../base-v2/ui/Dialog";
import { Badge } from "../base-v2/ui/Badge";
import { Alert, AlertDescription } from "../base-v2/ui/Alert";
import { Info } from 'lucide-react';
import { UpcomingSessionTableData, UploadedMaterial } from '~/lib/sessions/types/upcoming-sessions';
import UpcommingSessionClassCard from '../upcoming-sessions/UpcommingSessionCard';
import ClassCard from '../classes/ClassCard';
import { ClassListData, ClassType, NewStudentData } from '~/lib/classes/types/class-v2';
import { UpcomingSession } from '~/lib/sessions/types/session-v2';
import { format as dateFnsFormat } from 'date-fns';

const TutorDashboard = ({ nextSessionData, activeClassesData }: { nextSessionData: UpcomingSession[], activeClassesData: ClassType[]}) => {
  const [linkCopied, setLinkCopied] = useState({});
  const [upcomingSessionTableData, setUpcomingSessionTableData] = useState<UpcomingSessionTableData>();
  const [activeClassTableData, setActiveClassTableData] = useState<ClassListData[]>([]);

  useEffect(() => {
    if (nextSessionData && nextSessionData.length > 0) {
      const session = nextSessionData[0];
      const formattedDate = new Date(session?.start_time || "").toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const formattedTime = `${new Date(session?.start_time || '').toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })} - 
        ${new Date(session?.end_time || '').toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}`;
      const formattedData: UpcomingSessionTableData =  {
        id: session.id,
        name: `${session?.class?.name}`,
        subject: session?.class?.subject || "",
        date: formattedDate,
        time: formattedTime,
        registeredStudents: session?.class?.students?.length || 0,
        zoomLinkTutor: session?.meeting_url || "",
        zoomLinkStudent: session?.meeting_url || "",
        zoomMeetingId: session?.zoom_meeting_id || "",
        materials: (session?.materials || []).map((material) => {
          return {
            id: material.id,
            name: material.name || "",
            url: material.url || "",
            file_size: material.file_size || "",
          };
        }),
      };        
      setUpcomingSessionTableData(formattedData);
    }    
  }, [nextSessionData])

  useEffect(() => {
    if (activeClassesData) {
      const formattedData = activeClassesData.map((classData) => {
        // Ensure time_slots is an array before reducing
        const schedule = classData?.time_slots?.reduce((acc: string, slot: any, index: number, array) => {
          const timeSlotString = `${slot.day}, ${slot.startTime}-${slot.endTime}`;
          // Add a separator for all except the last item
          return acc + timeSlotString + (index < array.length - 1 ? "; " : "");
        }, "") || "No schedule available";

        const formattedDate = classData?.upcomingSession
          ? dateFnsFormat(new Date(classData.upcomingSession), "EEE, MMM dd, yyyy")
          : "No upcoming session";
  
        return {
          id: classData.id,
          name: classData?.name || "No name provided",
          schedule,
          status: classData?.status || "Unknown",
          students: classData?.students?.length || 0,
          grade: classData?.grade || "N/A",
          registrationLink: "",
          nextClass: formattedDate,
          classRawData: classData,
        };
      });
      setActiveClassTableData(formattedData);
    }
  }, [activeClassesData]);

  console.log('nextSessionData and activeClassesData:', nextSessionData, activeClassesData);

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
        {upcomingSessionTableData ? <UpcommingSessionClassCard
          sessionData={upcomingSessionTableData}
          variant="dashboard"
        /> : null}
      </div>

      {/* Active Classes */}
      <div className="space-y-4">
        <div className="flex items-center">
          <Info className="h-5 w-5 mr-2" />
          <h2 className="text-xl font-bold">Active Classes</h2>
        </div>
        <div>
          {activeClassTableData.map(classData => (
            <ClassCard
              key={classData.id}
              classData={classData}
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