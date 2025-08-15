'use client';

import { useEffect, useState, useMemo } from 'react';
import { Check, Edit, Link, Trash, Users, Plus } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import {
  ClassListData,
  ClassListStudent,
  ClassType,
  ClassWithTutorAndEnrollmentAdmin,
  EditClassData,
  SelectedClassAdmin,
  TimeSlot,
  TutorOption,
} from '~/lib/classes/types/class-v2';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../base-v2/ui/Select';
import { Badge } from '../../base-v2/ui/Badge';
import { GRADES } from '~/lib/constants-v2';
import { format, toZonedTime } from 'date-fns-tz';
import { generateRegistrationLinkAction } from '~/app/actions/registration-link';
import DeleteClassDialog from '../../classes/DeleteClassDialog';
import RegisteredStudentsDialog from '../../classes/RegisteredStudentsDialog';
import EditClassDialog from '../../classes/EditClassDialog';
import AppHeader from '../../AppHeader';
import TimezoneIndicator from '../../TimezoneIndicator';
import AdminCreateClassDialog from './AdminCreateClassDialog';
import Button from '~/core/ui/Button';
import DataTable from '~/core/ui/DataTable';
import { AdminNewClassData } from '~/lib/classes/types/class-v2';

const ClassesAdmin = ({
  classesData,
  tutors,
}: {
  classesData: ClassWithTutorAndEnrollmentAdmin[];
  tutors: TutorOption[];
}) => {
  const [selectedTutor, setSelectedTutor] = useState('');
  const [copiedLinks, setCopiedLinks] = useState<Record<string, boolean>>({});
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showStudentsDialog, setShowStudentsDialog] = useState(false);
  const [selectedClassName, setSelectedClassName] = useState<string | null>(
    null,
  );
  const [selectedClassStudents, setSelectedClassStudents] = useState<
    ClassListStudent[]
  >([]);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [selectedEditClassData, setSelectedEditClassData] =
    useState<ClassListData>({} as ClassListData);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  const createSchedule = (cls: ClassWithTutorAndEnrollmentAdmin) => {
    return (
      cls.time_slots?.reduce(
        (acc: string, slot: any, index: number, array: string | any[]) => {
          const timeSlotString = `${slot.day}, ${slot.startTime} - ${slot.endTime}`;
          // Add a separator for all except the last item
          return acc + timeSlotString + (index < array.length - 1 ? '; ' : '');
        },
        '',
      ) || 'No schedule available'
    );
  };

  const createClassRawData = (
    cls: ClassWithTutorAndEnrollmentAdmin,
  ): ClassType => {
    return {
      id: cls.id,
      created_at: undefined, // Not available in input, set to undefined
      name: cls.name,
      description: cls.description,
      subject: cls.subject,
      tutor_id: cls.tutorId,
      fee: cls.fee,
      status: cls.status,
      time_slots: cls.time_slots,
      grade: cls.grade,
      starting_date: cls.starting_date?.split('T')[0] ?? null,
      students: cls.students ?? [],
      upcomingSession: cls.upcomingSession,
    };
  };

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
    students: cls.students,
    schedule: createSchedule(cls),
    classRawData: createClassRawData(cls),
  }));

  const filteredData = classData.filter((cls) => {
    const nameMatch = selectedTutor
      ? cls.tutorName.toLowerCase().includes(selectedTutor.toLowerCase())
      : true;
    const yearMatch =
      selectedYear !== 'all' ? cls.grade === selectedYear : true;
    const statusMatch =
      selectedStatus !== 'all' ? cls.status === selectedStatus : true;
    return nameMatch && yearMatch && statusMatch;
  });

  const handleCopyLink = async (cls: (typeof classData)[0]) => {
    const nextSession = cls?.upcomingSession
      ? format(new Date(cls.upcomingSession), 'EEE, MMM dd, yyyy')
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
      tutorName: cls.tutorName || '',
    };

    const registrationLink =
      await generateRegistrationLinkAction(registrationData);

    navigator.clipboard.writeText(registrationLink);
    setCopiedLinks((prev) => ({ ...prev, [cls.id]: true }));
    setTimeout(() => {
      setCopiedLinks((prev) => ({ ...prev, [cls.id]: false }));
    }, 2000);
  };

  const handleUpdateClass = async (
    classId: string,
    updatedData: EditClassData,
  ) => {
    try {
      setEditLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
      setShowEditDialog(false);
    } catch (error) {
      console.error('Error updating class:', error);
    } finally {
      setEditLoading(false);
    }
  };

  const formatDataForEditCls = (cls: (typeof classData)[0]) => {
    return {
      id: cls.id,
      name: cls.name,
      schedule: cls.schedule || 'No schedule available',
      subject: cls.subject ?? undefined,
      status: cls.status!,
      grade: cls.grade,
      description: cls.description ?? undefined,
      classRawData: cls.classRawData,
    };
  };

  const handleSetEditClassData = (cls: (typeof classData)[0]) => {
    setSelectedEditClassData(() => formatDataForEditCls(cls));
  };

  const handleCreateClass = async (classData: AdminNewClassData) => {
    try {
      setCreateLoading(true);
      // The actual creation is handled in the dialog component
      // This is just for any additional logic if needed
    } catch (error) {
      console.error('Error creating class:', error);
    } finally {
      setCreateLoading(false);
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'active':
        return (
          <Badge
            variant="outline"
            className="bg-green-100 text-green-800 border-green-300"
          >
            Active
          </Badge>
        );
      case 'canceled':
        return (
          <Badge
            variant="outline"
            className="bg-red-100 text-red-800 border-red-300"
          >
            Canceled
          </Badge>
        );
      case 'inactive':
        return (
          <Badge
            variant="outline"
            className="bg-gray-100 text-gray-800 border-gray-300"
          >
            Inactive
          </Badge>
        );
      case 'draft':
        return (
          <Badge
            variant="outline"
            className="bg-yellow-100 text-yellow-800 border-yellow-300"
          >
            Draft
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="bg-gray-100 text-gray-800 border-gray-300"
          >
            {status || 'Unknown'}
          </Badge>
        );
    }
  };

  // Define column definitions for DataTable
  const columns: ColumnDef<(typeof classData)[0]>[] = useMemo(
    () => [
      {
        accessorKey: 'tutorName',
        header: 'Tutor Name',
        cell: ({ row }) => (
          <div className="whitespace-nowrap">{row.getValue('tutorName')}</div>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Class Name',
        cell: ({ row }) => (
          <div className="whitespace-nowrap">{row.getValue('name')}</div>
        ),
      },
      {
        id: 'day',
        header: 'Day',
        cell: ({ row }) => (
          <div className="whitespace-nowrap">{row.original.time?.day}</div>
        ),
      },
      {
        id: 'timeSlot',
        header: 'Time Slot',
        cell: ({ row }) => (
          <div className="whitespace-nowrap">
            {row.original.classRawData.time_slots ? (
              <>
                {row.original.time_slots![0]?.startTime} -
                {row.original.time_slots![0]?.endTime}
              </>
            ) : (
              <>-</>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <div className="whitespace-nowrap">
            {getStatusBadge(row.getValue('status'))}
          </div>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="whitespace-nowrap space-x-2">
            {/* View students Button */}
            <div className="relative group inline-block">
              <button
                onClick={() => {
                  setShowStudentsDialog(true);
                  setSelectedClassName(row.original.name);
                  row.original.students
                    ? setSelectedClassStudents(row.original.students)
                    : null;
                }}
                className="bg-white border-2 border-gray-300 text-black px-3 py-1 rounded hover:bg-green-600 hover:text-white transition-colors"
                aria-label="Attendance"
              >
                <Users className="h-4 w-4" />
              </button>
              <span className="absolute top-full left-1/2 -translate-x-1/2 mt-4 hidden group-hover:block bg-gray-800 text-white text-xs font-medium rounded py-1 px-2 z-10">
                View Students
              </span>
            </div>
            {/* Copy Link Button */}
            <div className="relative group inline-block">
              <button
                onClick={() => handleCopyLink(row.original)}
                className="bg-white border-2 border-gray-300 text-black px-3 py-1 rounded hover:bg-green-600 hover:text-white transition-colors"
                aria-label="Copy Link"
              >
                {copiedLinks[row.original.id] ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Link className="h-4 w-4" />
                )}
              </button>
              <span className="absolute top-full left-1/2 -translate-x-1/2 mt-4 hidden group-hover:block bg-gray-800 text-white text-xs font-medium rounded py-1 px-2 z-10">
                Copy Registration Link
              </span>
            </div>
            {/* Edit class button */}
            <div className="relative group inline-block">
              <button
                onClick={() => {
                  setShowEditDialog(true);
                  handleSetEditClassData(row.original);
                }}
                className="bg-white border-2 border-gray-300 text-black px-3 py-1 rounded hover:bg-green-600 hover:text-white transition-colors"
                aria-label="Edit"
              >
                <Edit className="h-4 w-4" />
              </button>
              <span className="absolute top-full left-1/2 -translate-x-1/2 mt-4 hidden group-hover:block bg-gray-800 text-white text-xs font-medium rounded py-1 px-2 z-10">
                Edit Class
              </span>
            </div>
          </div>
        ),
      },
    ],
    [copiedLinks],
  );

  // Define column widths - giving more width to tutor name and class name
  const columnWidths = {
    tutorName: '200px',
    name: '200px',
    day: '120px',
    timeSlot: '140px',
    status: '120px',
    actions: '180px',
  };

  return (
    <>
      <div className="max-w-screen p-6">
        {/* Header with Create Button */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Class groups</h1>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-blue-700 hover:bg-blue-900 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Class
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white shadow-md rounded-lg pb-4 pl-4 pr-4 mb-2">
          {/* Timezone Indicator */}
          <div className="flex justify-end">
            <TimezoneIndicator />
          </div>

          <div className="flex gap-6 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Tutor
              </label>
              <input
                type="text"
                value={selectedTutor}
                onChange={(e) => setSelectedTutor(e.target.value)}
                placeholder="Enter tutor name"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year Filter
              </label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-full">
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
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status Filter
              </label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Table */}
        <DataTable
          data={filteredData}
          columns={columns}
          columnWidths={columnWidths}
          tableProps={{
            className: 'bg-white shadow-md rounded-lg',
          }}
        />
      </div>

      <RegisteredStudentsDialog
        open={showStudentsDialog}
        onClose={() => setShowStudentsDialog(false)}
        classDataName={selectedClassName}
        studentData={selectedClassStudents}
      />

      <EditClassDialog
        open={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        onUpdateClass={handleUpdateClass}
        classData={selectedEditClassData}
        loading={editLoading}
      />

      <AdminCreateClassDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreateClass={handleCreateClass}
        loading={createLoading}
        tutors={tutors}
      />
    </>
  );
};

export default ClassesAdmin;
