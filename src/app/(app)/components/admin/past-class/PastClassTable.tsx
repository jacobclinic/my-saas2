'use client';

import { DateRangePicker } from '@heroui/date-picker';
import { useEffect, useState } from 'react';
import { PastSession } from '~/lib/sessions/types/session-v2';
import AttendanceDialog from '../../past-sessions/AttendanceDialog';
import { SelectedSession } from '~/lib/sessions/types/past-sessions';
import { Users } from 'lucide-react';

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

const PastClassesTable = ({
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
  const [selectedTutor, setSelectedTutor] = useState('');

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

  const classData = pastSessionsData.map((session) => ({
    id: session.id,
    tutorName: session.class?.tutor?.first_name || 'Unknown',
    name: session.class?.name,
    date: session.start_time,
    time:
      session.start_time && session.end_time
        ? `${session.start_time.split('T')[1]?.split('+')[0].slice(0, 5) || ''} - ${session.end_time.split('T')[1]?.split('+')[0].slice(0, 5) || ''}`
        : 'N/A',
    topic: session.title || 'Unknown',
    attendance: session.attendance || [],
  }));

  const filteredData = classData.filter((cls) => {
    const date = new Date(cls.date!);
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;

    return (
      (!from || date >= from) &&
      (!to || date <= to) &&
      (!selectedTutor ||
        cls.tutorName.toLowerCase().includes(selectedTutor.toLowerCase()))
    );
  });

  // Transform cls to SelectedSession
  const transformToSelectedSession = (
    cls: (typeof classData)[0],
  ): SelectedSession => ({
    id: cls.id,
    name: cls.name || '',
    date: cls.date?.split('T')[0] || '',
    time: cls.time || '',
    tutorName: cls.tutorName || null,
    topic: cls.topic || null,
    attendance: cls.attendance.map((att) => ({
      name: `${att.student?.first_name || ''} ${att.student?.last_name || ''}`.trim(),
      joinTime: att.time || '',
      duration: 'N/A', // calculate the duration using join time and leave time. Leave time is not provided
    })),
  });

  // Handle View button click to show AttendanceDialog
  const handleViewAttendance = (cls: (typeof classData)[0]) => {
    setSelectedSession(transformToSelectedSession(cls));
    setShowAttendanceDialog(true);
  };

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
              className="w-full sm:w-auto border rounded-lg border-gray-300"
            />
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
                  Start Time
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
                    <button
                      onClick={() => {
                        handleViewAttendance(cls);
                        console.log('View attendance for:', cls);
                      }}
                      className="bg-white-500 text-black outline-2 border-medium px-3 py-1 rounded hover:bg-green-600 text-sm"
                    >
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        Attendance
                      </div>
                    </button>
                    <button className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 text-sm">
                      Edit
                    </button>
                    <button className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm">
                      Delete
                    </button>
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
      />
    </>
  );
};

export default PastClassesTable;
