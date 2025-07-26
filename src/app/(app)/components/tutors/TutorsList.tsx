'use client';

import { useMemo, useState, useEffect } from 'react';

import Tile from '~/core/ui/Tile';
import DataTable from '~/core/ui/DataTable';
import Filter from '../base/Filter';
import SearchBar from '../base-v2/ui/SearchBar';
import { TutorTableData } from '~/lib/user/types/tutor';
import UserType from '~/lib/user/types/user';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../base-v2/ui/Tabs';
import { Button } from '../base-v2/ui/Button';
import { Badge } from '../base-v2/ui/Badge';
import { Eye, Edit } from 'lucide-react';

import { USER_ROLES } from '~/lib/constants';
import { useTablePagination } from '~/core/hooks/use-table-pagination';
import TutorView from './TutorView';
import TutorEdit from './TutorEdit';
import {
  updateTutorAction,
  UpdateTutorActionData,
} from '~/lib/user/actions/update-tutor-action';
import { toast } from 'sonner';
import { columnWidthsAdminTutor } from '~/lib/constants-v2';
import { CommaZoomUser } from '~/lib/zoom/v2/types';

export default function TutorsList({
  tutorsData,
}: {
  tutorsData: UserTypeWithDetails[];
}) {
  const [activeTab, setActiveTab] = useState('approved-tutors');
  const [tutors, setTutors] = useState<UserTypeWithDetails[]>(tutorsData);

  // Update local state when props change
  useEffect(() => {
    setTutors(tutorsData);
  }, [tutorsData]);

  const updateTutorInState = (updatedTutor: UserTypeWithDetails) => {
    setTutors((prevTutors) =>
      prevTutors.map((tutor) =>
        tutor.id === updatedTutor.id ? { ...tutor, ...updatedTutor } : tutor,
      ),
    );
  };

  // Separate tutors by approval status
  const approvedTutors = useMemo(() => {
    // Approved tutors are those with is_approved = true
    const approved = tutors.filter((tutor) => tutor.is_approved === true);
    console.log('Approved tutors count:', approved.length);
    return approved;
  }, [tutors]);

  const pendingTutors = useMemo(() => {
    // Pending tutors are those with is_approved = false or null
    const pending = tutors.filter(
      (tutor) => tutor.is_approved === false || tutor.is_approved === null,
    );
    console.log('Pending tutors count:', pending.length);
    return pending;
  }, [tutors]);

  return (
    <div className={'flex flex-col space-y-6 pb-36 h-[calc(100dvh-100px)]'}>
      <div>
        <Tile>
          <Tile.Heading>Tutors</Tile.Heading>

          <Tile.Body>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="approved-tutors">
                  Approved Tutors
                </TabsTrigger>
                <TabsTrigger value="pending-approval">
                  Pending Approval
                </TabsTrigger>
              </TabsList>

              <TabsContent value="approved-tutors">
                <ApprovedTutorsTable
                  tutorsData={approvedTutors}
                  onTutorUpdate={updateTutorInState}
                />
              </TabsContent>

              <TabsContent value="pending-approval">
                <PendingTutorsTable
                  tutorsData={pendingTutors}
                  onTutorUpdate={updateTutorInState}
                />
              </TabsContent>
            </Tabs>
          </Tile.Body>
        </Tile>
      </div>
    </div>
  );
}

// Extended TutorTableData for approved tutors
type ApprovedTutorTableData = TutorTableData & {
  subjects: string;
  activeClasses: number;
};

// Extended UserType with active classes count
type UserTypeWithDetails = UserType & {
  activeClassesCount?: number;
  zoom_user: CommaZoomUser | null;
};

// Helper function to get status badge variant
const getStatusBadgeVariant = (status: string) => {
  switch (status?.toUpperCase()) {
    case 'ACTIVE':
      return 'green';
    case 'REJECTED':
      return 'red';
    case 'INACTIVE':
      return 'gray';
    case 'PENDING':
      return 'yellow';
    default:
      return 'gray';
  }
};

// Extended TutorTableData for pending tutors
type PendingTutorTableData = TutorTableData & {
  subjects: string;
  appliedDate: string;
};

function ApprovedTutorsTable({
  tutorsData,
  onTutorUpdate,
}: {
  tutorsData: UserTypeWithDetails[];
  onTutorUpdate: (updatedTutor: UserTypeWithDetails) => void;
}) {
  const [searchFilter, setSearchFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTutor, setSelectedTutor] =
    useState<UserTypeWithDetails | null>(null);
  const [showTutorDialog, setShowTutorDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const handleViewTutor = (tutor: UserTypeWithDetails) => {
    setSelectedTutor(tutor);
    setShowTutorDialog(true);
  };

  const handleEditTutor = (tutor: UserTypeWithDetails) => {
    setSelectedTutor(tutor);
    setShowEditDialog(true);
  };

  const handleCloseTutorDialog = () => {
    setShowTutorDialog(false);
    setSelectedTutor(null);
  };

  const handleCloseEditDialog = () => {
    setShowEditDialog(false);
    setSelectedTutor(null);
  };

  const handleTutorUpdate = (updatedTutor: UserTypeWithDetails) => {
    onTutorUpdate(updatedTutor);
  };

  const handleSaveTutor = async (updatedData: Partial<UserTypeWithDetails>) => {
    if (!selectedTutor) return;

    try {
      // Create properly typed data for updateTutorAction
      const updateData: UpdateTutorActionData = {
        tutorId: selectedTutor.id,
        first_name: updatedData.first_name || selectedTutor.first_name || '',
        last_name: updatedData.last_name || selectedTutor.last_name || '',
        phone_number:
          updatedData.phone_number || selectedTutor.phone_number || '',
        address: updatedData.address || selectedTutor.address || '',
        birthday: updatedData.birthday || selectedTutor.birthday || '',
        education_level:
          updatedData.education_level || selectedTutor.education_level || '',
        subjects_teach:
          updatedData.subjects_teach || selectedTutor.subjects_teach || [],
        class_size: updatedData.class_size || selectedTutor.class_size || '',
        status: updatedData.status || selectedTutor.status || 'ACTIVE',
      };

      const result = await updateTutorAction(updateData);

      if (result.success) {
        toast.success('Tutor updated successfully');
        // Update the local state instead of reloading the page
        onTutorUpdate({ ...selectedTutor, ...updatedData });
      } else {
        toast.error(result.error || 'Failed to update tutor');
      }
    } catch (error) {
      console.error('Error updating tutor:', error);
      toast.error('An unexpected error occurred');
    }
  };

  const columns = [
    {
      header: 'Name',
      accessorKey: 'name',
    },
    {
      header: 'Email',
      accessorKey: 'email',
    },
    {
      header: 'Phone Number',
      accessorKey: 'phoneNumber',
    },
    {
      header: 'Subjects',
      accessorKey: 'subjects',
      cell: ({ row }: { row: { original: ApprovedTutorTableData } }) => {
        const tutorId = row.original.id;
        const tutor = tutorsData.find((t) => t.id === tutorId);
        const subjects = tutor?.subjects_teach || [];

        return (
          <div className="flex flex-wrap gap-1">
            {subjects.slice(0, 2).map((subject, index) => (
              <Badge key={index} variant="blue" className="text-xs">
                {subject}
              </Badge>
            ))}
            {subjects.length > 2 && (
              <Badge variant="blue" className="text-xs">
                +{subjects.length - 2}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      header: 'Active Classes',
      accessorKey: 'activeClasses',
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }: { row: { original: ApprovedTutorTableData } }) => {
        const tutorId = row.original.id;
        const tutor = tutorsData.find((t) => t.id === tutorId);
        const status = tutor?.status || 'INACTIVE';

        return (
          <Badge variant={getStatusBadgeVariant(status)} className="text-xs">
            {status}
          </Badge>
        );
      },
    },
    {
      header: 'Action',
      accessorKey: 'action',
      cell: ({ row }: { row: { original: ApprovedTutorTableData } }) => {
        const tutorId = row.original.id;
        const tutor = tutorsData.find((t) => t.id === tutorId);

        if (tutor) {
          return (
            <div className="flex justify-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditTutor(tutor)}
                className="text-green-600 hover:text-green-800 hover:bg-green-50"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleViewTutor(tutor)}
                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          );
        }
        return null;
      },
    },
  ];

  const filterOptions = [
    { label: 'All', value: 'all' },
    { label: 'Name', value: 'name' },
    { label: 'Email', value: 'email' },
    { label: 'Phone Number', value: 'phoneNumber' },
    { label: 'Subjects', value: 'subjects' },
    { label: 'Status', value: 'status' },
  ];

  // Filter tutors based on search and filters
  const filteredTutors = useMemo(() => {
    return tutorsData.filter((tutor) => {
      let matchesSearch = true;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const tutorName = tutor?.first_name
          ? `${tutor?.first_name} ${tutor?.last_name}`
          : '-';
        const tutorEmail = tutor?.email || '-';
        const tutorPhone = tutor?.phone_number || '-';
        const tutorStatus = tutor?.status || '-';
        const tutorSubjects = tutor?.subjects_teach?.join(', ') || '-';

        switch (searchFilter) {
          case 'name':
            matchesSearch = tutorName.toLowerCase().includes(query);
            break;
          case 'email':
            matchesSearch = tutorEmail.toLowerCase().includes(query);
            break;
          case 'phoneNumber':
            matchesSearch = tutorPhone.toLowerCase().includes(query);
            break;
          case 'subjects':
            matchesSearch = tutorSubjects.toLowerCase().includes(query);
            break;
          case 'status':
            matchesSearch = tutorStatus.toLowerCase().includes(query);
            break;
          case 'all':
          default:
            matchesSearch =
              tutorName.toLowerCase().includes(query) ||
              tutorEmail.toLowerCase().includes(query) ||
              tutorPhone.toLowerCase().includes(query) ||
              tutorSubjects.toLowerCase().includes(query) ||
              tutorStatus.toLowerCase().includes(query);
        }
      }
      return matchesSearch;
    });
  }, [tutorsData, searchQuery, searchFilter]);

  // Setup pagination
  const {
    paginatedData,
    pageIndex,
    pageSize,
    pageCount,
    handlePaginationChange,
  } = useTablePagination({ data: filteredTutors });

  // Map tutors to table data format
  const tableData: ApprovedTutorTableData[] = paginatedData.map((tutor) => ({
    id: tutor?.id,
    name: tutor?.first_name ? `${tutor?.first_name} ${tutor?.last_name}` : '-',
    email: tutor?.email || '-',
    phoneNumber: tutor?.phone_number || '-',
    subjects: tutor?.subjects_teach?.join(', ') || '-',
    activeClasses: tutor?.activeClassesCount || 0,
    status: tutor?.status || '-',
    action: 'Manage',
  }));

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-3 w-1/2">
          <SearchBar
            name="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search approved tutors by ${searchFilter === 'all' ? 'any field' : searchFilter}...`}
          />
          <Filter
            name="Search Filter"
            placeholder="Search by an attribute"
            width="150px"
            options={filterOptions}
            value={searchFilter}
            onChange={setSearchFilter}
          />
        </div>
      </div>
      <DataTable
        data={tableData}
        columns={columns}
        pageIndex={pageIndex}
        pageSize={pageSize}
        pageCount={pageCount}
        onPaginationChange={handlePaginationChange}
        columnWidths={columnWidthsAdminTutor}
      />

      {/* Tutor View Dialog */}
      <TutorView
        open={showTutorDialog}
        onClose={handleCloseTutorDialog}
        tutor={selectedTutor}
        onTutorUpdate={handleTutorUpdate}
      />

      {/* Tutor Edit Dialog */}
      <TutorEdit
        open={showEditDialog}
        onClose={handleCloseEditDialog}
        tutor={selectedTutor}
        onSave={handleSaveTutor}
      />
    </div>
  );
}

function PendingTutorsTable({
  tutorsData,
  onTutorUpdate,
}: {
  tutorsData: UserTypeWithDetails[];
  onTutorUpdate: (updatedTutor: UserTypeWithDetails) => void;
}) {
  const [searchFilter, setSearchFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTutor, setSelectedTutor] =
    useState<UserTypeWithDetails | null>(null);
  const [showTutorDialog, setShowTutorDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const handleViewTutor = (tutor: UserTypeWithDetails) => {
    setSelectedTutor(tutor);
    setShowTutorDialog(true);
  };

  // const handleEditTutor = (tutor: UserTypeWithDetails) => {
  //   setSelectedTutor(tutor);
  //   setShowEditDialog(true);
  // };

  const handleCloseTutorDialog = () => {
    setShowTutorDialog(false);
    setSelectedTutor(null);
  };

  const handleCloseEditDialog = () => {
    setShowEditDialog(false);
    setSelectedTutor(null);
  };

  const handleTutorUpdate = (updatedTutor: UserTypeWithDetails) => {
    onTutorUpdate(updatedTutor);
  };

  const handleSaveTutor = async (updatedData: Partial<UserTypeWithDetails>) => {
    if (!selectedTutor) return;

    try {
      // Create properly typed data for updateTutorAction
      const updateData: UpdateTutorActionData = {
        tutorId: selectedTutor.id,
        first_name: updatedData.first_name || selectedTutor.first_name || '',
        last_name: updatedData.last_name || selectedTutor.last_name || '',
        phone_number:
          updatedData.phone_number || selectedTutor.phone_number || '',
        address: updatedData.address || selectedTutor.address || '',
        birthday: updatedData.birthday || selectedTutor.birthday || '',
        education_level:
          updatedData.education_level || selectedTutor.education_level || '',
        subjects_teach:
          updatedData.subjects_teach || selectedTutor.subjects_teach || [],
        class_size: updatedData.class_size || selectedTutor.class_size || '',
        status: updatedData.status || selectedTutor.status || 'ACTIVE',
      };

      const result = await updateTutorAction(updateData);

      if (result.success) {
        toast.success('Tutor updated successfully');
        // Update the local state instead of reloading the page
        onTutorUpdate({ ...selectedTutor, ...updatedData });
      } else {
        toast.error(result.error || 'Failed to update tutor');
      }
    } catch (error) {
      console.error('Error updating tutor:', error);
      toast.error('An unexpected error occurred');
    }
  };

  const columns = [
    {
      header: 'Name',
      accessorKey: 'name',
    },
    {
      header: 'Email',
      accessorKey: 'email',
    },
    {
      header: 'Phone Number',
      accessorKey: 'phoneNumber',
    },
    {
      header: 'Subjects',
      accessorKey: 'subjects',
      cell: ({ row }: { row: { original: PendingTutorTableData } }) => {
        const tutorId = row.original.id;
        const tutor = tutorsData.find((t) => t.id === tutorId);
        const subjects = tutor?.subjects_teach || [];

        return (
          <div className="flex flex-wrap gap-1">
            {subjects.slice(0, 2).map((subject, index) => (
              <Badge key={index} variant="blue" className="text-xs">
                {subject}
              </Badge>
            ))}
            {subjects.length > 2 && (
              <Badge variant="blue" className="text-xs">
                +{subjects.length - 2}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      header: 'Applied Date',
      accessorKey: 'appliedDate',
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }: { row: { original: PendingTutorTableData } }) => {
        const tutorId = row.original.id;
        const tutor = tutorsData.find((t) => t.id === tutorId);
        const status = tutor?.status || 'PENDING';

        return (
          <Badge variant={getStatusBadgeVariant(status)} className="text-xs">
            {status}
          </Badge>
        );
      },
    },
    {
      header: 'Action',
      accessorKey: 'action',
      cell: ({ row }: { row: { original: PendingTutorTableData } }) => {
        const tutorId = row.original.id;
        const tutor = tutorsData.find((t) => t.id === tutorId);

        if (tutor) {
          return (
            <div className="flex justify-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleViewTutor(tutor)}
                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          );
        }
        return null;
      },
    },
  ];

  const filterOptions = [
    { label: 'All', value: 'all' },
    { label: 'Name', value: 'name' },
    { label: 'Email', value: 'email' },
    { label: 'Phone Number', value: 'phoneNumber' },
    { label: 'Subjects', value: 'subjects' },
  ];

  // Filter tutors based on search and filters
  const filteredTutors = useMemo(() => {
    return tutorsData.filter((tutor) => {
      let matchesSearch = true;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const tutorName = tutor?.first_name
          ? `${tutor?.first_name} ${tutor?.last_name}`
          : '-';
        const tutorEmail = tutor?.email || '-';
        const tutorPhone = tutor?.phone_number || '-';
        const tutorSubjects = tutor?.subjects_teach?.join(', ') || '-';

        switch (searchFilter) {
          case 'name':
            matchesSearch = tutorName.toLowerCase().includes(query);
            break;
          case 'email':
            matchesSearch = tutorEmail.toLowerCase().includes(query);
            break;
          case 'phoneNumber':
            matchesSearch = tutorPhone.toLowerCase().includes(query);
            break;
          case 'subjects':
            matchesSearch = tutorSubjects.toLowerCase().includes(query);
            break;
          case 'all':
          default:
            matchesSearch =
              tutorName.toLowerCase().includes(query) ||
              tutorEmail.toLowerCase().includes(query) ||
              tutorPhone.toLowerCase().includes(query) ||
              tutorSubjects.toLowerCase().includes(query);
        }
      }
      return matchesSearch;
    });
  }, [tutorsData, searchQuery, searchFilter]);

  // Setup pagination
  const {
    paginatedData,
    pageIndex,
    pageSize,
    pageCount,
    handlePaginationChange,
  } = useTablePagination({ data: filteredTutors });

  // Map tutors to table data format
  const tableData: PendingTutorTableData[] = paginatedData.map((tutor) => ({
    id: tutor?.id,
    name: tutor?.first_name ? `${tutor?.first_name} ${tutor?.last_name}` : '-',
    email: tutor?.email || '-',
    phoneNumber: tutor?.phone_number || '-',
    subjects: tutor?.subjects_teach?.join(', ') || '-',
    appliedDate: tutor?.created_at
      ? new Date(tutor.created_at).toLocaleDateString()
      : '-',
    status: tutor?.status || '-',
    action: 'Review',
  }));

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-3 w-1/2">
          <SearchBar
            name="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search pending tutors by ${searchFilter === 'all' ? 'any field' : searchFilter}...`}
          />
          <Filter
            name="Search Filter"
            placeholder="Search by an attribute"
            width="150px"
            options={filterOptions}
            value={searchFilter}
            onChange={setSearchFilter}
          />
        </div>
      </div>
      <DataTable
        data={tableData}
        columns={columns}
        pageIndex={pageIndex}
        pageSize={pageSize}
        pageCount={pageCount}
        onPaginationChange={handlePaginationChange}
      />

      {/* Tutor View Dialog */}
      <TutorView
        open={showTutorDialog}
        onClose={handleCloseTutorDialog}
        tutor={selectedTutor}
        onTutorUpdate={handleTutorUpdate}
      />

      {/* Tutor Edit Dialog */}
      <TutorEdit
        open={showEditDialog}
        onClose={handleCloseEditDialog}
        tutor={selectedTutor}
        onSave={handleSaveTutor}
      />
    </div>
  );
}
