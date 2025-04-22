'use client';

import { useEffect, useState } from 'react';
import { SelectedSession } from '~/lib/sessions/types/past-sessions';
import { Check, Link, Trash, Users } from 'lucide-react';
import { deleteSessionAction } from '~/lib/sessions/server-actions';
import useCsrfToken from '~/core/hooks/use-csrf-token';
import {
  ClassListData,
  ClassType,
  ClassWithTutorAndEnrollmentAdmin,
  SelectedClassAdmin,
} from '~/lib/classes/types/class-v2';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../base-v2/ui/Select';
import { GRADES } from '~/lib/constants-v2';
import { format as dateFnsFormat } from 'date-fns';
import { generateRegistrationLinkAction } from '~/app/actions/registration-link';
import DeleteClassDialog from '../../classes/DeleteClassDialog';

const ClassesAdmin = ({
  classesData,
}: {
  classesData: ClassWithTutorAndEnrollmentAdmin[];
}) => {
  const [selectedSession, setSelectedSession] =
    useState<SelectedClassAdmin | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedTutor, setSelectedTutor] = useState('');
  const [copiedLinks, setCopiedLinks] = useState<Record<string, boolean>>({});
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteClassLoading, setDeleteClassLoading] = useState(false);

  const csrfToken = useCsrfToken();

  const classData = classesData.map((cls) => ({
    id: cls.id,
    tutorName: cls.tutor.first_name + ' ' + cls.tutor.last_name,
    name: cls.name,
    time:
      cls.time_slots && cls.time_slots.length > 0 ? cls.time_slots[0] : null,
    subject: cls.subject,
    time_slots: cls.time_slots,
    grade: cls.grade,
    description: cls.description,
    fee: cls.fee,
    status: cls.status,
    upcomingSession: cls.upcomingSession,
  }));

  const filteredData = classData.filter((cls) => {
    const nameMatch = selectedTutor
      ? cls.tutorName.toLowerCase().includes(selectedTutor.toLowerCase())
      : true;

    const yearMatch =
      selectedYear !== 'all' ? cls.grade === selectedYear : true;
    return nameMatch && yearMatch;
  });

  const handleCopyLink = async (cls: (typeof classData)[0]) => {
    const nextSession = cls?.upcomingSession
      ? dateFnsFormat(new Date(cls.upcomingSession), 'EEE, MMM dd, yyyy')
      : 'No upcoming session';

    const clsSchedule =
      cls?.time_slots?.reduce(
        (acc: string, slot: any, index: number, array) => {
          const timeSlotString = `${slot.day}, ${slot.startTime} - ${slot.endTime}`;
          return acc + timeSlotString + (index < array.length - 1 ? '; ' : '');
        },
        '',
      ) || 'No schedule available';
    const registrationData = {
      classId: cls.id,
      className: cls.name || '',
      nextSession: nextSession || '',
      time: clsSchedule || '',
    };

    const registrationLink =
      await generateRegistrationLinkAction(registrationData);

    navigator.clipboard.writeText(registrationLink);
    setCopiedLinks((prev) => ({ ...prev, [cls.id]: true }));
    setTimeout(() => {
      setCopiedLinks((prev) => ({ ...prev, [cls.id]: false }));
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

  const handleDeleteClass = async (classId: string) => {
    try {
      setDeleteClassLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Error adding student:', error);
    } finally {
      setDeleteClassLoading(false);
    }
  };

  // Transform cls to SelectedSession
  // const transformToSelectedSession = (
  //   cls: (typeof classData)[0],
  // ): SelectedClassAdmin => ({
  //   id: cls.id,
  //   name: cls.name || '',
  //   time_slots: cls.time
  //     ? [
  //         {
  //           day: cls.time.day,
  //           start_time: cls.time.startTime,
  //           end_time: cls.time.endTime,
  //         },
  //       ]
  //     : [],
  //   description: cls.description,
  //   subject: cls.subject,
  //   tutorName: cls.tutorName,
  //   fee: cls.fee,
  //   status: cls.status,
  //   grade: cls.grade,
  //   upcomingSession: cls.upcomingSession,
  // });

  const handleViewDeleteDialog = (classId: string) => {
    setSelectedClassId(classId);
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
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {GRADES.map((grade) => {
                  return (
                    <SelectItem key={grade} value={grade}>
                      {grade}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
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
                  Status
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
                  <td className="px-6 py-4 whitespace-nowrap">{cls.status}</td>
                  <td className="px-6 py-4 whitespace-nowrap space-x-2">
                    {/* Attendance Button */}
                    <div className="relative group inline-block">
                      <button
                        onClick={() => {}}
                        className="bg-white border-2 border-gray-300 text-black px-3 py-1 rounded hover:bg-green-600 hover:text-white transition-colors"
                        aria-label="Attendance"
                      >
                        <Users className="h-4 w-4" />
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
                      </button>
                      <span className="absolute top-full left-1/2 -translate-x-1/2 mt-4 hidden group-hover:block bg-gray-800 text-white text-xs font-medium rounded py-1 px-2 z-10">
                        Copy Registration Link
                      </span>
                    </div>

                    {/* Delete Button */}
                    <div className="relative group inline-block">
                      <button
                        className="bg-red-500 text-white px-3 py-1  rounded hover:bg-red-600 transition-colors"
                        aria-label="Delete"
                        disabled={cls.status === 'canceled'}
                        onClick={() => handleViewDeleteDialog(cls.id)}
                      >
                        <Trash className="h-4 w-4" />
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

      <DeleteClassDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onDeleteClass={handleDeleteClass}
        classId={selectedClassId!}
        loading={deleteClassLoading}
      />
    </>
  );
};

export default ClassesAdmin;
