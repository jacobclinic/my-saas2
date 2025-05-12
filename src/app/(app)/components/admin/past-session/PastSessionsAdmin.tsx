'use client';

import { DateRangePicker } from '@heroui/date-picker';
import { useCallback, useEffect, useState } from 'react';
import { PastSession } from '~/lib/sessions/types/session-v2';
import AttendanceDialog from '../../past-sessions/AttendanceDialog';
import {
  SelectedSession,
  SelectedSessionAdmin,
} from '~/lib/sessions/types/past-sessions';
import { Check, Link, Trash, Users } from 'lucide-react';
import useCsrfToken from '~/core/hooks/use-csrf-token';
import DeleteSessionDialog from './DeleteSessionDialog';
import { format, toZonedTime } from 'date-fns-tz';
import { Attendance, ZoomParticipant } from '~/lib/zoom/types/zoom.types';
import { getAttendanceAction } from '~/lib/sessions/server-actions-v2';

// Set the local timezone (e.g., 'Asia/Colombo' for Sri Lanka, GMT+5:30)
const LOCAL_TIMEZONE = 'Asia/Colombo';

interface DateRange {
  start?: {
    year: number;
    month: number;
    day: number;
  } | null;
  end?: {
    year: number;
    month: number;
    day: number;
  } | null;
}

const PastSessionsAdmin = ({
  pastSessionsData,
}: {
  pastSessionsData: PastSession[];
}) => {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [showAttendanceDialog, setShowAttendanceDialog] = useState(false);
  const [selectedSession, setSelectedSession] =
    useState<SelectedSession | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null,
  );
  const [selectedTutor, setSelectedTutor] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [copiedLinks, setCopiedLinks] = useState<Record<string, boolean>>({});
  const [attendanceData, setAttendanceData] = useState<Attendance[]>([]);

  const handleDateRangeChange = (value: any) => {
    setDateRange(value);
  };

  const dateObjectToDate = (dateObj: any): Date | null => {
    if (!dateObj) return null;
    return new Date(dateObj.year, dateObj.month - 1, dateObj.day);
  };

  useEffect(() => {
    if (dateRange) {
      const from = dateObjectToDate(dateRange.start);
      const to = dateObjectToDate(dateRange.end);

      setFromDate(from ? from.toISOString().split('T')[0] : '');
      setToDate(to ? to.toISOString().split('T')[0] : '');
    } else {
      setFromDate('');
      setToDate('');
    }
  }, [dateRange]);

  const classData = pastSessionsData.map((session) => {
    const startTimeUtc = session.start_time
      ? new Date(session.start_time)
      : null;
    const endTimeUtc = session.end_time ? new Date(session.end_time) : null;

    // Convert UTC to local timezone using toZonedTime
    const startTimeLocal = startTimeUtc
      ? toZonedTime(startTimeUtc, LOCAL_TIMEZONE)
      : null;
    const endTimeLocal = endTimeUtc
      ? toZonedTime(endTimeUtc, LOCAL_TIMEZONE)
      : null;

    // Format times in local timezone
    const formattedStartTime = startTimeLocal
      ? format(startTimeLocal, 'hh:mm a')
      : 'N/A';
    const formattedEndTime = endTimeLocal
      ? format(endTimeLocal, 'hh:mm a')
      : 'N/A';

    return {
      id: session.id,
      tutorName: session.class?.tutor?.first_name || 'Unknown',
      name: session.class?.name,
      date: session.start_time,
      attendance_marked: session.attendance_marked,
      time:
        startTimeUtc && endTimeUtc
          ? `${formattedStartTime} - ${formattedEndTime}`
          : 'N/A',
      topic: session.title || 'Unknown',
      attendance: session.attendance || [],
      subject: session.class?.subject || null,
      zoomMeetingId: session.zoom_meeting_id || null,
    };
  });

  const filteredData = classData.filter((cls) => {
    const sessionDate = cls.date ? new Date(cls.date) : null;
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;

    if (!sessionDate) return false;

    const sessionDateOnly = new Date(sessionDate);
    sessionDateOnly.setHours(0, 0, 0, 0);

    if (from) from.setHours(0, 0, 0, 0);
    if (to) to.setHours(23, 59, 59, 999);

    return (
      (!from || sessionDateOnly >= from) &&
      (!to || sessionDateOnly <= to) &&
      (!selectedTutor ||
        cls.tutorName.toLowerCase().includes(selectedTutor.toLowerCase()))
    );
  });

  const handleCopyLink = (cls: (typeof classData)[0]) => {
    const link = `${process.env.NEXT_PUBLIC_SITE_URL}/sessions/student/${cls.id}?type=upcoming&redirectUrl=${encodeURIComponent(
      `${process.env.NEXT_PUBLIC_SITE_URL}/sessions/student/${cls.id}?type=upcoming&sessionId=${cls.id}&className=${cls.name}&sessionDate=${cls.date}&sessionTime=${cls.time}&sessionSubject=${cls.subject}&sessionTitle=${cls.topic}`,
    )}`;
    navigator.clipboard.writeText(link);
    setCopiedLinks((prev) => ({ ...prev, [cls.id]: true }));
    setTimeout(() => {
      setCopiedLinks((prev) => ({ ...prev, [cls.id]: false }));
    }, 2000);
  };

  const [deleteClassLoading, setDeleteClassLoading] = useState(false);

  const handleDeleteClass = async (classId: string) => {
    try {
      setDeleteClassLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Error deleting class:', error);
    } finally {
      setDeleteClassLoading(false);
    }
  };

  // Transform cls to SelectedSession
  const transformToSelectedSession = (
    cls: (typeof classData)[0],
  ): SelectedSessionAdmin => ({
    id: cls.id,
    name: cls.name || '',
    date: cls.date?.split('T')[0] || '',
    time: cls.time || '',
    tutorName: cls.tutorName || null,
    topic: cls.topic || null,
    subject: cls.subject || null,
    attendance_marked: cls.attendance_marked!,
    attendance: cls.attendance.map((att) => ({
      name: att.name,
      join_time: att.join_time || '',
      leave_time: att.leave_time || '',
      email: att.email || '',
      time: att.time || '',
    })),
  });

  // Handle View button click to show AttendanceDialog
  const handleViewAttendance = async (cls: (typeof classData)[0]) => {
    if (cls.attendance_marked) {
      setAttendanceData(cls.attendance);
      setShowAttendanceDialog(true);
    } else {
      const classId = cls.id;
      const zoomMeetingId = cls.zoomMeetingId!;
      const result = await getAttendanceAction({ zoomMeetingId, classId });
      const formattedData = result.attendance.map(
        (student: ZoomParticipant) => ({
          time: String(student.duration),
          name: student.name,
          email: student.email,
          join_time: student.join_time,
          leave_time: student.leave_time,
        }),
      );
      setAttendanceData(formattedData);
      setShowAttendanceDialog(true);
    }
    setSelectedSession(transformToSelectedSession(cls));
    setShowAttendanceDialog(true);
  };

  const handleViewDeleteDialog = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setShowDeleteDialog(true);
  };

  // const getAttendance = useCallback(
  //   async (sessionId: string): Promise<void> => {},
  //   [pastSessionsData, classId],
  // );

  return (
    <>
      <div className="max-w-7xl p-6">
        <h1 className="text-3xl font-bold mb-6">Past Classes</h1>

        {/* Filters */}
        <div className="bg-white shadow-md rounded-lg p-4 mb-6 flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Tutor
            </label>
            <input
              type="text"
              value={selectedTutor}
              onChange={(e) => setSelectedTutor(e.target.value)}
              placeholder="Enter tutor name"
              className="border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date filter
            </label>
            <DateRangePicker
              value={dateRange as any}
              aria-label="Date Range"
              onChange={handleDateRangeChange}
              onReset={() => setDateRange(null)}
              className="w-full sm:w-auto border rounded-lg border-gray-300"
            />
          </div>
          <div>
            <button
              hidden={!dateRange}
              onClick={() => setDateRange(null)}
              className="text-sm border border-gray-300 rounded-md px-3 py-2.5"
              aria-label="Clear date filter"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tutor Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Class Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((cls) => (
                <tr key={cls.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {cls.tutorName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{cls.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {cls.date?.split('T')[0]}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{cls.time}</td>
                  <td className="px-6 py-4 whitespace-nowrap space-x-2">
                    {/* Attendance Button */}
                    <div className="relative group inline-block">
                      <button
                        onClick={() => handleViewAttendance(cls)}
                        className="bg-white border-2 border-gray-300 text-black px-3 py-1 rounded hover:bg-green-600 hover:text-white transition-colors"
                        aria-label="Attendance"
                      >
                        <Users className="h-4 w-4" />
                        <span className="sr-only">Attendance</span>
                      </button>
                      <span className="absolute top-full left-1/2 -translate-x-1/2 mt-4 hidden group-hover:block bg-gray-800 text-white text-xs font-medium rounded py-1 px-2 z-10">
                        Attendance
                      </span>
                    </div>

                    {/* Copy Link Button */}
                    <div className="relative group inline-block">
                      <button
                        onClick={() => handleCopyLink(cls)}
                        className="bg-white border-2 border-gray-300 text-black px-3 py-1 rounded hover:bg-green-600 hover:text-white transition-colors"
                        aria-label="Copy Link"
                      >
                        {copiedLinks[cls.id] ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Link className="h-4 w-4" />
                        )}
                        <span className="sr-only">Copy Link</span>
                      </button>
                      <span className="absolute top-full left-1/2 -translate-x-1/2 mt-4 hidden group-hover:block bg-gray-800 text-white text-xs font-medium rounded py-1 px-2 z-10">
                        Copy student Link
                      </span>
                    </div>

                    {/* Delete Button */}
                    <div className="relative group inline-block">
                      <button
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors"
                        aria-label="Delete"
                        onClick={() => handleViewDeleteDialog(cls.id)}
                      >
                        <Trash className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </button>
                      <span className="absolute top-full left-1/2 -translate-x-1/2 mt-4 hidden group-hover:block bg-gray-800 text-white text-xs font-medium rounded py-1 px-2 z-10">
                        Delete
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-gray-500 py-4">
                    No classes found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attendance Dialog */}
      <AttendanceDialog
        showAttendanceDialog={showAttendanceDialog}
        setShowAttendanceDialog={setShowAttendanceDialog}
        selectedSession={selectedSession}
        attendance={attendanceData}
      />

      <DeleteSessionDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onDeleteSession={handleDeleteClass}
        sessionId={selectedSessionId!}
        loading={deleteClassLoading}
      />
    </>
  );
};

export default PastSessionsAdmin;
