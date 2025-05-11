"use client";

import { useState } from 'react';
import { Calendar, Clock, Users, Copy, FileText, Video, UserCheck, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Student {
  id: string;
  name: string;
  joinTime: string;
  duration: string;
}

interface PastClassCardProps {
  id: string;
  title: string;
  subject: string;
  date: string;
  time: string;
  students: number;
  hasMaterials?: boolean;
  hasRecording?: boolean;
  attendance: number;
}

export function PastClassCard({ 
  id, 
  title, 
  subject, 
  date, 
  time, 
  students,
  hasMaterials = false,
  hasRecording = false,
  attendance
}: PastClassCardProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [showMaterials, setShowMaterials] = useState(false);
  const [showAttendance, setShowAttendance] = useState(false);

  const handleCopyLink = () => {
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Mock materials data
  const materials = hasMaterials ? [
    { id: '1', name: 'Lecture Notes.pdf', size: '2.4 MB' },
    { id: '2', name: 'Practice Questions.pdf', size: '1.1 MB' },
    { id: '3', name: 'Tutorial Slides.pptx', size: '3.7 MB' }
  ] : [];

  // Mock student attendance data
  const attendedStudents: Student[] = [
    { id: '1', name: 'John Doe', joinTime: '2:30 PM', duration: '5h 00m' },
    { id: '2', name: 'Jane Smith', joinTime: '2:31 PM', duration: '4h 55m' },
    { id: '3', name: 'Alice Johnson', joinTime: '2:33 PM', duration: '4h 57m' },
    { id: '4', name: 'Bob Wilson', joinTime: '2:35 PM', duration: '4h 45m' },
    { id: '5', name: 'Carol Brown', joinTime: '2:40 PM', duration: '4h 50m' },
    { id: '6', name: 'David Lee', joinTime: '2:45 PM', duration: '4h 30m' },
    { id: '7', name: 'Eva Garcia', joinTime: '2:50 PM', duration: '4h 40m' }
  ].slice(0, attendance);

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
                  {title}
                </CardTitle>
                <Badge variant="outline" className="mt-1 bg-primary-blue-50 text-primary-blue-700 border-primary-blue-200">
                  {subject}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-4 pb-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50">
              <Calendar size={18} className="text-primary-blue-600" />
              <div>
                <p className="text-sm font-medium text-neutral-900">{date}</p>
                <p className="text-xs text-neutral-600">Date</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50">
              <Clock size={18} className="text-primary-blue-600" />
              <div>
                <p className="text-sm font-medium text-neutral-900">{time}</p>
                <p className="text-xs text-neutral-600">Time</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50">
              <Users size={18} className="text-primary-blue-600" />
              <div>
                <p className="text-sm font-medium text-neutral-900">{students} Students</p>
                <p className="text-xs text-neutral-600">Total</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50">
              <UserCheck size={18} className="text-primary-blue-600" />
              <div>
                <p className="text-sm font-medium text-neutral-900">{attendance} Attended</p>
                <p className="text-xs text-neutral-600">{Math.round((attendance / students) * 100)}% Attendance</p>
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="pt-3 grid grid-cols-2 md:grid-cols-4 gap-2 border-t border-neutral-100">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="w-full text-neutral-700 hover:bg-neutral-100 border border-neutral-200"
                  onClick={handleCopyLink}
                >
                  <Copy size={16} className="mr-2" />
                  <span>{isCopied ? 'Copied!' : 'Copy Link'}</span>
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
                  className={`w-full text-neutral-700 hover:bg-neutral-100 border border-neutral-200 ${
                    hasMaterials ? 'bg-primary-blue-50 border-primary-blue-100' : ''
                  }`}
                  onClick={() => setShowMaterials(true)}
                  disabled={!hasMaterials}
                >
                  <FileText size={16} className="mr-2" />
                  <span>Materials {hasMaterials && materials.length > 0 && `(${materials.length})`}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{hasMaterials ? 'View class materials' : 'No materials available'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  className={`w-full text-neutral-700 hover:bg-neutral-100 border border-neutral-200 ${
                    hasRecording ? 'bg-primary-blue-50 border-primary-blue-100' : ''
                  }`}
                  disabled={!hasRecording}
                >
                  <Video size={16} className="mr-2" />
                  <span>Recording</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{hasRecording ? 'View class recording' : 'No recording available'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  className={`w-full text-neutral-700 hover:bg-neutral-100 border border-neutral-200 ${
                    attendance > 0 ? 'bg-primary-blue-50 border-primary-blue-100' : ''
                  }`}
                  onClick={() => setShowAttendance(true)}
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

      <Dialog open={showMaterials} onOpenChange={setShowMaterials}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Class Materials</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3">
            {materials.map((material) => (
              <div 
                key={material.id}
                className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <FileText size={18} className="text-primary-blue-600" />
                  <div>
                    <p className="text-sm font-medium">{material.name}</p>
                    <p className="text-xs text-neutral-500">{material.size}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary-blue-600 hover:text-primary-blue-700 hover:bg-primary-blue-50"
                >
                  Download
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAttendance} onOpenChange={setShowAttendance}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Attendance Details</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-neutral-50 rounded-lg">
                <p className="text-sm font-medium text-neutral-600">Total Students</p>
                <p className="text-2xl font-bold text-neutral-900">{students}</p>
              </div>
              <div className="p-4 bg-primary-blue-50 rounded-lg">
                <p className="text-sm font-medium text-primary-blue-600">Attended</p>
                <p className="text-2xl font-bold text-primary-blue-700">{attendance}</p>
              </div>
              <div className="p-4 bg-primary-blue-50 rounded-lg">
                <p className="text-sm font-medium text-primary-blue-600">Attendance Rate</p>
                <p className="text-2xl font-bold text-primary-blue-700">
                  {Math.round((attendance / students) * 100)}%
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-neutral-900">Students Present</h3>
              <ScrollArea className="h-[300px] rounded-md border border-neutral-200">
                <div className="p-4 space-y-2">
                  {attendedStudents.map((student) => (
                    <div 
                      key={student.id}
                      className="flex items-center justify-between py-2 px-3 hover:bg-neutral-50 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-blue-100 text-primary-blue-600 font-medium">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-neutral-900">{student.name}</p>
                          <p className="text-xs text-neutral-500">Joined at {student.joinTime}</p>
                        </div>
                      </div>
                      <div className="text-sm text-neutral-600">
                        {student.duration}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}