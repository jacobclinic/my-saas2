'use client'

import React, { useEffect, useState } from 'react';
import type {
  UpcomingSessionTableData,
  UploadedMaterial
} from '~/lib/sessions/types/upcoming-sessions';
import { Alert, AlertDescription } from "../base-v2/ui/Alert";
import { Input } from "../base-v2/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../base-v2/ui/Select";
import { Info, Search } from 'lucide-react';
import UpcommingSessionCard from './UpcommingSessionCard';
import { UpcomingSession } from '~/lib/sessions/types/session-v2';

const UpcomingSessions = ({ upcomingSessionData }: { upcomingSessionData: UpcomingSession[] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('all');
  const [upcomingSessionTableData, setUpcomingSessionTableData] = useState<UpcomingSessionTableData[]>([]);

  useEffect(() => {
    if (upcomingSessionData) {
      const formattedData: UpcomingSessionTableData[] = upcomingSessionData.map((session) => {
        const formattedDate = new Date(session?.start_time || "").toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const formattedTime = `${new Date(session?.start_time || '').toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })} - 
          ${new Date(session?.end_time || '').toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}`;
        return {
          id: session.id,
          name: `${session?.class?.name}`,
          subject: session?.class?.subject || "",
          date: formattedDate,
          time: formattedTime,
          registeredStudents: session?.class?.students?.length || 0,
          zoomLinkTutor: session?.meeting_url || "",
          zoomLinkStudent: session?.meeting_url || "",
          materials: session.materials.map((material) => {
            return {
              id: material.id,
              name: material.name || "",
              url: material.url || "",
              file_size: material.file_size || "",
            };
          }),
        };        
      });
      setUpcomingSessionTableData(formattedData);
    }    
  }, [upcomingSessionData])

  // Sample data for upcoming sessions
  const upcomingSessions: UpcomingSessionTableData[] = [
    {
      id: "1",
      name: "2025 A-Levels Batch 1",
      subject: "Accounting",
      date: "Monday, Dec 18, 2024",
      time: "4:00 PM - 6:00 PM",
      registeredStudents: 25,
      zoomLinkTutor: "https://zoom.us/j/123456789",
      zoomLinkStudent: "https://zoom.us/j/987654321",
      materials: [
        { id: "1", name: "Chapter 5 - Manufacturing Accounts Notes.pdf", file_size: "2.5" },
        { id: "2", name: "Practice Problems Set.pdf", file_size: "1.8" }
      ]
    },
    {
      id: "2",
      name: "2024 A-Levels Revision Batch",
      subject: "Accounting",
      date: "Monday, Dec 18, 2024",
      time: "6:30 PM - 8:30 PM",
      registeredStudents: 30,
      zoomLinkTutor: "https://zoom.us/j/123456789",
      zoomLinkStudent: "https://zoom.us/j/987654321"
    },
    {
      id: "3",
      name: "2025 A-Levels Batch 2",
      subject: "Accounting",
      lessonTitle: "Partnership Accounts",
      lessonDescription: "Understanding partnership agreements, profit sharing ratios, and capital accounts.",
      date: "Tuesday, Dec 19, 2024",
      time: "4:00 PM - 6:00 PM",
      registeredStudents: 28,
      zoomLinkTutor: "https://zoom.us/j/123456789",
      zoomLinkStudent: "https://zoom.us/j/987654321",
      materials: [
        { id: "1", name: "Partnership Accounts Notes.pdf", file_size: "3.0" }
      ]
    }
  ];

  return (
    <div className="p-6 max-w-6xl xl:min-w-[900px] mx-auto space-y-6">
      {/* Header & Search */}
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Upcoming Classes</h1>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search by class name..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={selectedDate} onValueChange={setSelectedDate}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="tomorrow">Tomorrow</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quick Tip */}
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-700">
          Tip: Upload class materials at least 24 hours before the class to give students time to prepare.
        </AlertDescription>
      </Alert>

      {/* Classes List */}
      <div className="space-y-6">
        {upcomingSessionTableData
          .filter(cls => {
            if (searchTerm) {
              return cls.name.toLowerCase().includes(searchTerm.toLowerCase());
            }
            return true;
          })
          .map(sessionData => (
            <UpcommingSessionCard
              key={sessionData.id}
              sessionData={sessionData}
            />
          ))}
      </div>
    </div>
  );
};

export default UpcomingSessions;