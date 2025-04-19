'use client';

import { useEffect, useState } from 'react';
import { SelectedSession } from '~/lib/sessions/types/past-sessions';
import { Link, Trash, Users } from 'lucide-react';
import { deleteSessionAction } from '~/lib/sessions/server-actions';
import useCsrfToken from '~/core/hooks/use-csrf-token';
import { ClassWithTutorAndEnrollment } from '~/lib/classes/types/class';
import {
  ClassType,
  ClassWithTutorAndEnrollmentAdmin,
  SelectedClassAdmin,
} from '~/lib/classes/types/class-v2';

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

const ClassesTable = ({
  classesData,
}: {
  classesData: ClassWithTutorAndEnrollmentAdmin[];
}) => {
  const [showAttendanceDialog, setShowAttendanceDialog] = useState(false);
  const [selectedSession, setSelectedSession] =
    useState<SelectedClassAdmin | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null,
  );

  const [selectedTutor, setSelectedTutor] = useState('');

  const [linkCopied, setLinkCopied] = useState<boolean>(false);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const csrfToken = useCsrfToken();

  const dateObjectToDate = (dateObj: any): Date | null => {
    if (!dateObj) return null;
    return new Date(dateObj.year, dateObj.month - 1, dateObj.day);
  };

  const classData = classesData.map((cls) => ({
    id: cls.id,
    tutorName: cls.tutor.first_name + ' ' + cls.tutor.last_name,
    name: cls.name,
    time: cls.time_slots && cls.time_slots.length > 0 ? cls.time_slots[0] : null,
    subject: cls.subject,
    grade: cls.grade,
    description: cls.description,
    fee: cls.fee,
    status: cls.status,
  }));

  console.log(classData);

  const filteredData = classData.filter((cls) => {
    return (
      !selectedTutor ||
      cls.tutorName.toLowerCase().includes(selectedTutor.toLowerCase())
    );
  });

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
    setTimeout(() => {
      setLinkCopied(false);
    }, 2000);
  };

  const deletePastSession = async (sessionId: string) => {
    try {
      const response = await deleteSessionAction({ csrfToken, sessionId });
      if (response.success) {
        alert('Successfully deleted session');
        return;
      }
      alert('Failed to delete session. Please try again.');
    } catch (error) {
      alert('Failed to delete session. Please try again.');
    }
  };

  // Transform cls to SelectedSession
  const transformToSelectedSession = (
    cls: (typeof classData)[0],
  ): SelectedClassAdmin => ({
    id: cls.id,
    name: cls.name || '',
    time_slots: cls.time
      ? [
          {
            day: cls.time.day,
            start_time: cls.time.startTime,
            end_time: cls.time.endTime,
          },
        ]
      : [],
    description: cls.description,
    subject: cls.subject,
    tutorName: cls.tutorName,
    fee: cls.fee,
    status: cls.status,
    grade: cls.grade,
  });

  // Handle View button click to show AttendanceDialog
  const handleViewAttendance = (cls: (typeof classData)[0]) => {
    setSelectedSession(transformToSelectedSession(cls));
    setShowAttendanceDialog(true);
  };

  const handleViewDeleteDialog = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setShowDeleteDialog(true);
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
              Year Filter
            </label>
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
                  Day
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Time slot
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
                    {cls.time?.day}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {cls.time?.startTime}-{cls.time?.endTime}
                  </td>
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
                      <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 hidden group-hover:block bg-gray-800 text-white text-xs font-medium rounded py-1 px-2 z-10">
                        Attendance
                      </span>
                    </div>

                    {/* Copy Link Button */}
                    <div className="relative group inline-block">
                      <button
                        onClick={() => handleCopyLink(``)}
                        className="bg-white border-2 border-gray-300 text-black px-3 py-1 rounded hover:bg-green-600 hover:text-white transition-colors"
                        aria-label="Copy Link"
                      >
                        <Link className="h-4 w-4" />
                        <span className="sr-only">Copy Link</span>
                      </button>
                      <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 hidden group-hover:block bg-gray-800 text-white text-xs font-medium rounded py-1 px-2 z-10">
                        Copy student Link
                      </span>
                    </div>

                    {/* Delete Button */}
                    <div className="relative group inline-block">
                      <button
                        className="bg-red-500 text-white px-3 py-1  rounded hover:bg-red-600 transition-colors"
                        aria-label="Delete"
                        onClick={() => handleViewDeleteDialog(cls.id)}
                      >
                        <Trash className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </button>
                      <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 hidden group-hover:block bg-gray-800 text-white text-xs font-medium rounded py-1 px-2 z-10">
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

      {/* 
      <DeleteSessionDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onDeleteSession={handleDeleteClass}
        sessionId={selectedSessionId!}
        loading={deleteClassLoading}
      /> */}
    </>
  );
};

export default ClassesTable;
