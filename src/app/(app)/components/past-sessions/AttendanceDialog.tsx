'use client'

import React from 'react';
import type { AttendanceDialogProps } from '~/lib/sessions/types/past-sessions';
import { Button } from "../base-v2/ui/Button";
import { Badge } from "../base-v2/ui/Badge";
import { Download } from 'lucide-react';
import BaseDialog from '../base-v2/BaseDialog';

const AttendanceDialog: React.FC<AttendanceDialogProps> = ({ 
    showAttendanceDialog, 
    setShowAttendanceDialog, 
    selectedSession 
  }) => {
    const handleExport = () => {
      // Handle attendance export
      console.log('Exporting attendance for:', selectedSession?.id);
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
              <p className="text-sm text-gray-600">{selectedSession?.date}</p>
              <p className="text-sm text-gray-600">{selectedSession?.time}</p>
            </div>
            <Badge variant="outline">{selectedSession?.attendance.length} Students</Badge>
          </div>
  
          <div className="border rounded-lg">
            <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 font-medium border-b">
              <div>Student Name</div>
              <div>Join Time</div>
              <div>Duration</div>
            </div>
            {selectedSession?.attendance.map((student, idx) => (
              <div key={idx} className="grid grid-cols-3 gap-4 p-3 border-b">
                <div>{student.name}</div>
                <div>{student.joinTime}</div>
                <div>{student.duration}</div>
              </div>
            ))}
          </div>
        </div>
      </BaseDialog>
    );
  };
  
  export default AttendanceDialog;