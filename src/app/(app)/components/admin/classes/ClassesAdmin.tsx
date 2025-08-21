'use client';

import { useState } from 'react';
import { Check, Edit, Link, Users } from 'lucide-react';
import {
  ClassListData,
  ClassListStudent,
  ClassType,
  ClassWithTutorAndEnrollmentAdmin,
  EditClassData,
} from '~/lib/classes/types/class-v2';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../base-v2/ui/Select';
import { Badge } from '../../base-v2/ui/Badge';
import { GRADES, PAGE_SIZE } from '~/lib/constants-v2';
import { format } from '~/lib/utils/date-utils';
import { copyToClipboard } from '~/lib/utils/clipboard';
import { createShortUrlAction } from '~/lib/short-links/server-actions-v2';
import RegisteredStudentsDialog from '../../classes/RegisteredStudentsDialog';
import EditClassDialog from '../../classes/EditClassDialog';
import TimezoneIndicator from '../../TimezoneIndicator';
import useCsrfToken from '~/core/hooks/use-csrf-token';
import DataTable from '~/core/ui/DataTable';
import { useMemo } from 'react';

// Helper function to get status badge variant
const getStatusBadgeVariant = (status: string) => {
  switch (status?.toUpperCase()) {
    case 'ACTIVE':
      return 'green';
    case 'CANCELED':
      return 'red';
    default:
      return 'gray';
  }
};

// Column widths configuration
const columnWidths = {
  tutorName: '200px',
  className: '250px',
  day: '100px',
  timeSlot: '150px',
  status: '120px',
  actions: '200px',
};

// Table data type for DataTable
type ClassTableData = {
  id: string;
  tutorName: string;
  className: string;
  day: string;
  timeSlot: string;
  status: string;
  actions: string;
};

const ClassesAdmin = ({
  classesData,
}: {
  classesData: ClassWithTutorAndEnrollmentAdmin[];
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
  const csrfToken = useCsrfToken();

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
      selectedStatus !== 'all'
        ? cls.status?.toUpperCase() === selectedStatus.toUpperCase()
        : true;
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

    // Create URL with parameters
    const urlParams = new URLSearchParams({
      classId: registrationData.classId,
      className: registrationData.className,
      nextSession: registrationData.nextSession,
      time: registrationData.time,
      tutorName: registrationData.tutorName,
    });

    const registrationUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/self-registration?${urlParams.toString()}`;

    const shortLinkResult = await createShortUrlAction({
      originalUrl: registrationUrl,
      csrfToken: csrfToken,
    });

    const finalLink =
      shortLinkResult.success && shortLinkResult.shortUrl
        ? shortLinkResult.shortUrl
        : registrationUrl;

    await copyToClipboard(finalLink);
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

  // Create lookup map for O(1) access to class data
  const classLookupMap = useMemo(() => {
    return filteredData.reduce(
      (map, cls) => {
        map[cls.id] = cls;
        return map;
      },
      {} as Record<string, (typeof filteredData)[0]>,
    );
  }, [filteredData]);

  // Define columns for DataTable
  const columns = useMemo(
    () => [
      {
        header: 'Tutor Name',
        accessorKey: 'tutorName',
      },
      {
        header: 'Class Name',
        accessorKey: 'className',
      },
      {
        header: 'Day',
        accessorKey: 'day',
      },
      {
        header: 'Time Slot',
        accessorKey: 'timeSlot',
      },
      {
        header: 'Status',
        accessorKey: 'status',
        cell: ({ row }: { row: { original: ClassTableData } }) => {
          const classId = row.original.id;
          const cls = classLookupMap[classId];

          return (
            <Badge
              variant={getStatusBadgeVariant(cls?.status || '')}
              className="text-xs"
            >
              {cls?.status?.toUpperCase() || 'Unknown'}
            </Badge>
          );
        },
      },
      {
        header: 'Actions',
        accessorKey: 'actions',
        cell: ({ row }: { row: { original: ClassTableData } }) => {
          const classId = row.original.id;
          const cls = classLookupMap[classId];

          if (!cls) return null;

          return (
            <div className="space-x-2">
              {/* View students Button */}
              <div className="relative group inline-block">
                <button
                  onClick={() => {
                    setShowStudentsDialog(true);
                    setSelectedClassName(cls.name);
                    cls.students
                      ? setSelectedClassStudents(cls.students)
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
              {/* Edit class button */}
              <div className="relative group inline-block">
                <button
                  onClick={() => {
                    setShowEditDialog(true);
                    handleSetEditClassData(cls);
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
          );
        },
      },
    ],
    [classLookupMap],
  );

  // Prepare table data for DataTable
  const tableData: ClassTableData[] = useMemo(() => {
    return filteredData.map((cls) => ({
      id: cls.id,
      tutorName: cls.tutorName,
      className: cls.name,
      day: cls.time?.day || '-',
      timeSlot:
        cls.classRawData.time_slots && cls.time_slots?.[0]
          ? `${cls.time_slots[0].startTime} - ${cls.time_slots[0].endTime}`
          : '-',
      status: cls.status || 'Unknown',
      actions: 'Actions',
    }));
  }, [filteredData]);

  return (
    <>
      <div className="max-w-7xl p-6">
        {/* Filters */}
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status Filter
              </label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <TimezoneIndicator />
          </div>
        </div>

        {/* DataTable */}
        <DataTable
          data={tableData}
          columns={columns}
          columnWidths={columnWidths}
          pageSize={PAGE_SIZE}
          pageCount={Math.ceil(tableData.length / PAGE_SIZE)}
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
    </>
  );
};

export default ClassesAdmin;
