'use client';

import React from 'react';
import type { AttendanceDialogProps } from '~/lib/sessions/types/past-sessions';
import { Button } from '../base-v2/ui/Button';
import { Badge } from '../base-v2/ui/Badge';
import { Download } from 'lucide-react';
import BaseDialog from '../base-v2/BaseDialog';
import { generateCustomPDF } from '~/lib/utils/pdfGenerator';
import { ScrollArea } from '../base-v2/ui/scroll-area';
import { parseISO, format } from 'date-fns';

const AttendanceDialog: React.FC<AttendanceDialogProps> = ({
  showAttendanceDialog,
  setShowAttendanceDialog,
  selectedSession,
  attendance,
}) => {
  // Helper function to extract just the time (hours and minutes) from a timestamp
  const extractTimeFromTimestamp = (timestamp: string): string => {
    if (!timestamp) return 'N/A';

    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'N/A';
    }
  };
  const handleExport = () => {
    if (!selectedSession || attendance.length === 0) {
      return;
    }

    // Format class time to ensure it's on a single line
    const formattedTime = selectedSession.time.replace(/\s+/g, ' ');

    // Prepare data for PDF generation
    const columnNames = [
      'Student Name',
      'Email',
      'Join Time',
      'Leave Time',
      'Duration',
    ];

    const columnKeys = ['name', 'email', 'join_time', 'leave_time', 'duration'];

    // Transform attendance data to include formatted values
    const formattedData = attendance.map((student) => ({
      name: student.name || 'Unknown',
      email: student.email || 'N/A',
      join_time: student.join_time
        ? extractTimeFromTimestamp(student.join_time)
        : 'N/A',
      leave_time: student.leave_time
        ? extractTimeFromTimestamp(student.leave_time)
        : 'N/A',
      duration:
        student.leave_time && student.join_time
          ? calculateDuration(student.join_time, student.leave_time)
          : 'N/A',
    }));

    // Generate PDF using the custom PDF generator
    generateCustomPDF({
      data: formattedData,
      columnNames: columnNames,
      columnKeys: columnKeys,
      title: `Class Attendance - ${selectedSession.name}`,
      headerData: {
        className: selectedSession.name,
        classDate: selectedSession.date,
        classTime: formattedTime,
        numberOfStudents: attendance.length - 1, // Excluding the tutor
      },
      filename: `Attendance_${selectedSession.name.replace(/\s+/g, '_')}_${selectedSession.date.replace(/\//g, '-')}`,
    });
  };

  // Helper function to calculate duration between two ISO timestamp strings
  const calculateDuration = (joinTime: string, leaveTime: string) => {
    try {
      const start = new Date(joinTime).getTime();
      const end = new Date(leaveTime).getTime();
      const durationMs = end - start;

      // Convert to minutes
      const minutes = Math.floor(durationMs / 60000);

      if (minutes >= 60) {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}m`;
      }

      return `${minutes}m`;
    } catch (error) {
      return 'N/A';
    }
  };

  const calculateAttendancePercentage = ({
    attendanceCount,
    totalStudents,
    subtractOne = false,
  }: {
    attendanceCount: number;
    totalStudents: number;
    subtractOne?: boolean;
  }): string => {
    if (totalStudents === undefined || totalStudents <= 0) {
      return '0%';
    }

    const adjustedCount = subtractOne ? attendanceCount - 1 : attendanceCount;
    const finalCount = Math.max(0, adjustedCount);
    const percentage = (finalCount / totalStudents) * 100;

    return `${percentage.toFixed(1)}%`;
  }

  const dialogFooter = (
    <Button
      className="w-full"
      onClick={handleExport}
      disabled={attendance.length === 0}
    >
      <Download className="h-4 w-4 mr-2" />
      Export Attendance
    </Button>
  );

  return (
    <BaseDialog
      open={showAttendanceDialog}
      onClose={() => setShowAttendanceDialog(false)}
      title={`Class Attendance - ${selectedSession?.name}`}
      footer={attendance.length > 0 ? dialogFooter : null}
      maxWidth="2xl"
      showCloseButton={false}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-neutral-50 rounded-lg flex flex-col items-center justify-center">
            <p className="text-sm font-medium text-neutral-600">Total Students</p>
            <p className="text-2xl font-bold text-neutral-900 mt-2">{selectedSession?.noOfStudents}</p>
          </div>
          <div className="p-4 bg-primary-blue-50 rounded-lg flex flex-col items-center justify-center">
            <p className="text-sm font-medium text-primary-blue-600">Attended</p>
            <p className="text-2xl font-bold text-primary-blue-700 mt-2">  {selectedSession?.attendance?.length ?? 0}</p>
          </div>
          <div className="p-4 bg-primary-blue-50 rounded-lg flex flex-col items-center justify-center">
            <p className="text-sm font-medium text-primary-blue-600">Attendance Rate</p>
            <p className="text-2xl font-bold text-primary-blue-700 mt-2">
              {calculateAttendancePercentage({
                attendanceCount: selectedSession?.attendance?.length ?? 0,
                totalStudents: selectedSession?.noOfStudents || 0,
                subtractOne: false,
              })}
            </p>
          </div>
        </div>
        {attendance.length > 0 ? <div className="space-y-4">
          <h3 className="text-sm font-medium text-neutral-900">Students Present</h3>
          <ScrollArea className="h-[300px] rounded-md border border-neutral-200">
            <div className="p-4 space-y-2">
              {attendance?.map((student, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 px-3 hover:bg-neutral-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {student.name ? <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-blue-100 text-primary-blue-600 font-medium">
                      {student.name.charAt(0)}
                    </div> : null}
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{student.name}</p>
                      {student.join_time ? <p className="text-xs text-neutral-500">Joined at {format(parseISO(student.join_time), 'h.mma')}</p> : null}
                    </div>
                  </div>
                  <div className="text-sm text-neutral-600">
                    {student.join_time && student.leave_time
                      ? calculateDuration(student.join_time, student.leave_time)
                      : 'N/A'}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div> : null}
      </div>
    </BaseDialog>
  );
};

export default AttendanceDialog;
