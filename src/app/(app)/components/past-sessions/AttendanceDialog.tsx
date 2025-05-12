'use client';

import React from 'react';
import type { AttendanceDialogProps } from '~/lib/sessions/types/past-sessions';
import { Button } from '../base-v2/ui/Button';
import { Badge } from '../base-v2/ui/Badge';
import { Download } from 'lucide-react';
import BaseDialog from '../base-v2/BaseDialog';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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

    // Create a new PDF document
    const doc = new jsPDF();
    const currentDate = new Date().toLocaleDateString();

    // Add title and class information
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(`Class Attendance - ${selectedSession.name}`, 14, 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Date: ${selectedSession.date}`, 14, 25);
    doc.text(`Time: ${selectedSession.time}`, 14, 30);
    doc.text(`Total Students: ${attendance.length}`, 14, 35);

    // Prepare table data
    const tableColumn = ['Student Name', 'Join Time', 'Duration'];
    const tableRows = attendance.map((student) => [
      student.name || 'Unknown',
      student.join_time ? extractTimeFromTimestamp(student.join_time) : 'N/A',
      student.leave_time && student.join_time
        ? calculateDuration(student.join_time, student.leave_time)
        : 'N/A',
    ]);

    // Add the table to the PDF
    autoTable(doc, {
      startY: 40,
      head: [tableColumn],
      body: tableRows,
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [22, 160, 133] },
    });

    // Save the PDF
    const fileName = `Attendance_${selectedSession.name.replace(/\s+/g, '_')}_${selectedSession.date.replace(/\//g, '-')}.pdf`;
    doc.save(fileName);
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
    <Button className="w-full" onClick={handleExport}>
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
        <div className="border rounded-lg">
          <div className="grid grid-cols-4 gap-4 p-3 bg-gray-50 font-medium border-b">
            <div>Student Name</div>
            <div>Email</div>
            <div>Join Time</div>
            <div>Leave Time</div>
          </div>
          {attendance?.map((student, idx) => (
            <div key={idx} className="grid grid-cols-4 gap-4 p-3 border-b">
              <div>{student.name}</div>
              <div>{student.email}</div>
              <div>
                {student.join_time
                  ? extractTimeFromTimestamp(student.join_time)
                  : 'N/A'}
              </div>
              <div>
                {student.leave_time
                  ? extractTimeFromTimestamp(student.leave_time)
                  : 'N/A'}
              </div>
              {/* Uncomment if you want to show duration */}
              {/* <div>{student.duration}</div> */}
            </div>
          ))}
        </div>
      </div>
    </BaseDialog>
  );
};

export default AttendanceDialog;
