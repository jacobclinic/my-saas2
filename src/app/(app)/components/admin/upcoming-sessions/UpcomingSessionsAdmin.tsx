'use client';

import { DateRangePicker } from '@heroui/date-picker';
import { useEffect, useState } from 'react';
import { UpcomingSession } from '~/lib/sessions/types/session-v2';
import { Check, Edit, Link, Trash } from 'lucide-react';
import DeleteSessionDialog from '../past-session/DeleteSessionDialog';
import { format } from 'date-fns';
import {
  convertToLocalTime,
  getUserTimezone,
} from '~/lib/utils/timezone-utils';
import TimezoneIndicator from '../../TimezoneIndicator';
import EditSessionDialog from '../../upcoming-sessions/EditSessionDialog';

interface DateRange {
  start?: { year: number; month: number; day: number } | null;
  end?: { year: number; month: number; day: number } | null;
}

const UpcomingSessionsAdmin = ({
  upcomingSessionData,
}: {
  upcomingSessionData: UpcomingSession[];
}) => {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null,
  );
  const [copiedLinks, setCopiedLinks] = useState<Record<string, boolean>>({});
  const [selectedTutor, setSelectedTutor] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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
  const classData = upcomingSessionData.map((session) => {
    // Convert UTC to local timezone respecting user's timezone
    const startTimeLocal = convertToLocalTime(session.start_time);
    const endTimeLocal = convertToLocalTime(session.end_time);

    // Format times in user's local timezone
    const formattedStartTime = startTimeLocal
      ? format(startTimeLocal, 'hh:mm a')
      : 'N/A';
    const formattedEndTime = endTimeLocal
      ? format(endTimeLocal, 'hh:mm a')
      : 'N/A';

    return {
      id: session.id,
      tutorName:
        session.class?.tutor?.first_name +
          ' ' +
          session.class?.tutor?.last_name || 'unknown',
      name: session.class?.name,
      date: session.start_time,
      time:
        startTimeLocal && endTimeLocal
          ? `${formattedStartTime} - ${formattedEndTime}`
          : 'N/A',
      topic: session.title || 'Unknown',
      subject: session.class?.subject || null,
    };
  });

  const filteredData = classData.filter((cls) => {
    const sessionDate = cls.date ? new Date(cls.date) : null;
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;

    if (!sessionDate) return false;

    const sessionDateOnly = new Date(sessionDate);
    sessionDateOnly.setHours(0, 0, 0, 0);

    // Create adjusted comparison dates by adding one day
    let fromCompare = null;
    let toCompare = null;

    if (from) {
      fromCompare = new Date(from);
      fromCompare.setHours(0, 0, 0, 0);
      // Add one day to from date for comparison
      fromCompare.setDate(fromCompare.getDate() + 1);
    }

    if (to) {
      toCompare = new Date(to);
      toCompare.setHours(23, 59, 59, 999);
      // Add one day to to date for comparison
      toCompare.setDate(toCompare.getDate() + 1);
    }

    return (
      (!fromCompare || sessionDateOnly >= fromCompare) &&
      (!toCompare || sessionDateOnly <= toCompare) &&
      (!selectedTutor ||
        cls.tutorName?.toLowerCase().includes(selectedTutor.toLowerCase()))
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

  // Edit session dialog state
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editSessionId, setEditSessionId] = useState<string | null>(null);
  const [editSessionData, setEditSessionData] = useState<any>(null);

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

  const handleViewDeleteDialog = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setShowDeleteDialog(true);
  };

  // Handler to open edit dialog
  const handleEditSession = (sessionId: string) => {
    // Find the session data from upcomingSessionData
    const session = upcomingSessionData.find((s) => s.id === sessionId);
    if (!session) return;
    // Pass the original UTC times to the dialog - it will handle conversion internally
    setEditSessionData({
      title: session.title || '',
      description: session.description || '',
      startTime: session.start_time,
      endTime: session.end_time,
      materials: session.materials || [],
      meetingUrl: session.meeting_url || '',
    });
    setEditSessionId(sessionId);
    setShowEditDialog(true);
  };

  return (
    <>
      <div className="max-w-7xl p-6">
        <div className="bg-white shadow-md rounded-lg p-4 mb-6 flex justify-between">
          <div className="flex flex-wrap gap-4 items-end">
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
          <div>
            <TimezoneIndicator />
          </div>
        </div>

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
                    {/* Edit session button */}
                    <div className="relative group inline-block">
                      <button
                        onClick={() => handleEditSession(cls.id)}
                        className="bg-white border-2 border-gray-300 text-black px-3 py-1 rounded hover:bg-green-600 hover:text-white transition-colors"
                        aria-label="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <span className="absolute top-full left-1/2 -translate-x-1/2 mt-4 hidden group-hover:block bg-gray-800 text-white text-xs font-medium rounded py-1 px-2 z-10">
                        Edit Session
                      </span>
                    </div>
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
      <DeleteSessionDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onDeleteSession={handleDeleteClass}
        sessionId={selectedSessionId!}
        loading={deleteClassLoading}
      />
      {/* Edit Session Dialog */}
      {showEditDialog && editSessionId && editSessionData && (
        <EditSessionDialog
          open={showEditDialog}
          onClose={() => setShowEditDialog(false)}
          sessionId={editSessionId}
          sessionData={editSessionData}
        />
      )}
    </>
  );
};

export default UpcomingSessionsAdmin;
