'use client';

import { useMemo, useState } from 'react';

import Tile from '~/core/ui/Tile';
import DataTable from '~/core/ui/DataTable';
import Filter from '../base/Filter';
import SearchBar from '../base-v2/ui/SearchBar';
import { TutorTableData } from '~/lib/user/types/tutor';
import UserType from '~/lib/user/types/user';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../base-v2/ui/Tabs';
import { Button } from '../base-v2/ui/Button';
import { Eye } from 'lucide-react';

import { USER_ROLES } from '~/lib/constants';
import CreateUserModal from '../base/CreateUserModal';
import { useTablePagination } from '~/core/hooks/use-table-pagination';
import TutorView from './TutorView';

export default function TutorsList({
  tutorsData,
}: {
  tutorsData: UserTypeWithDetails[];
}) {
  const [activeTab, setActiveTab] = useState('approved-tutors');

  // Separate tutors by approval status
  const approvedTutors = useMemo(() => {
    console.log(
      'All tutors data:',
      tutorsData.map((t) => ({
        id: t.id,
        name: `${t.first_name} ${t.last_name}`,
        status: t.status,
        is_approved: t.is_approved,
      })),
    );
    // Approved tutors are those with is_approved = true
    const approved = tutorsData.filter((tutor) => tutor.is_approved === true);
    console.log('Approved tutors count:', approved.length);
    return approved;
  }, [tutorsData]);

  const pendingTutors = useMemo(() => {
    // Pending tutors are those with is_approved = false or null
    const pending = tutorsData.filter(
      (tutor) => tutor.is_approved === false || tutor.is_approved === null,
    );
    console.log('Pending tutors count:', pending.length);
    return pending;
  }, [tutorsData]);

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
                <ApprovedTutorsTable tutorsData={approvedTutors} />
              </TabsContent>

              <TabsContent value="pending-approval">
                <PendingTutorsTable tutorsData={pendingTutors} />
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
};

// Extended TutorTableData for pending tutors
type PendingTutorTableData = TutorTableData & {
  subjects: string;
  appliedDate: string;
};

function ApprovedTutorsTable({
  tutorsData,
}: {
  tutorsData: UserTypeWithDetails[];
}) {
  const [searchFilter, setSearchFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTutor, setSelectedTutor] =
    useState<UserTypeWithDetails | null>(null);
  const [showTutorDialog, setShowTutorDialog] = useState(false);

  const handleViewTutor = (tutor: UserTypeWithDetails) => {
    setSelectedTutor(tutor);
    setShowTutorDialog(true);
  };

  const handleCloseTutorDialog = () => {
    setShowTutorDialog(false);
    setSelectedTutor(null);
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
    },
    {
      header: 'Active Classes',
      accessorKey: 'activeClasses',
    },
    {
      header: 'Status',
      accessorKey: 'status',
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
        <CreateUserModal userRole={USER_ROLES.TUTOR} />
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
      />
    </div>
  );
}

function PendingTutorsTable({
  tutorsData,
}: {
  tutorsData: UserTypeWithDetails[];
}) {
  const [searchFilter, setSearchFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTutor, setSelectedTutor] =
    useState<UserTypeWithDetails | null>(null);
  const [showTutorDialog, setShowTutorDialog] = useState(false);

  const handleViewTutor = (tutor: UserTypeWithDetails) => {
    setSelectedTutor(tutor);
    setShowTutorDialog(true);
  };

  const handleCloseTutorDialog = () => {
    setShowTutorDialog(false);
    setSelectedTutor(null);
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
    },
    {
      header: 'Applied Date',
      accessorKey: 'appliedDate',
    },
    {
      header: 'Status',
      accessorKey: 'status',
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
      />
    </div>
  );
}
