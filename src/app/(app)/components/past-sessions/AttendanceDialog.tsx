'use client';

import React from 'react';
import type { AttendanceDialogProps } from '~/lib/sessions/types/past-sessions';
import { Button } from '../base-v2/ui/Button';
import { Badge } from '../base-v2/ui/Badge';
import { Download } from 'lucide-react';
import BaseDialog from '../base-v2/BaseDialog';
import { generateCustomPDF } from '~/lib/utils/pdfGenerator';

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
      footer={dialogFooter}
      maxWidth="2xl"
      showCloseButton={false}
    >
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">
              Date: {selectedSession?.date}
            </p>
            <p className="text-sm text-gray-600">
              Time: {selectedSession?.time}
            </p>
          </div>
          <Badge variant="outline">{attendance.length} Students</Badge>
        </div>{' '}
        <div>
          <p className="text-sm text-gray-600">
            Total Students: {selectedSession?.noOfStudents}
          </p>
          <p className="text-sm text-gray-600">
            Attendance Rate:{' '}
            {selectedSession?.noOfStudents !== undefined &&
            selectedSession?.noOfStudents > 0
              ? `${(((attendance.length - 1) / selectedSession.noOfStudents) * 100).toFixed(1)}%`
              : '0%'}
          </p>
          {/* (attendance.length - 1) to exclude the tutor */}
        </div>
        <div className="border rounded-lg">
          <div className="grid grid-cols-4 gap-4 p-3 bg-gray-50 font-medium border-b">
            <div>Name</div>
            <div></div>
            <div></div>
            <div>Duration</div>
          </div>
          {attendance?.map((student, idx) => (
            <div key={idx} className="grid grid-cols-4 gap-4 p-3 border-b">
              <div>{student.name}</div>
              <div></div>
              <div></div>
              <div>
                {student.join_time && student.leave_time
                  ? calculateDuration(student.join_time, student.leave_time)
                  : 'N/A'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </BaseDialog>
  );
};

export default AttendanceDialog;
