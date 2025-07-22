'use client';

import { useMemo, useState } from 'react';

import Tile from '~/core/ui/Tile';
import DataTable from '~/core/ui/DataTable';
import Filter from '../base/Filter';
import SearchBar from '../base-v2/ui/SearchBar';
import { TutorTableData } from '~/lib/user/types/tutor';
import UserType from '~/lib/user/types/user';

import { USER_ROLES } from '~/lib/constants';
import CreateUserModal from '../base/CreateUserModal';
import { useTablePagination } from '~/core/hooks/use-table-pagination';

export default function TutorsList({ tutorsData }: { tutorsData: UserType[] }) {
  return (
    <div className={'flex flex-col space-y-6 pb-36 h-[calc(100dvh-100px)]'}>
      <div>
        <Tile>
          <Tile.Heading>Tutors</Tile.Heading>

          <Tile.Body>
            <DataTableExample tutorsData={tutorsData} />
          </Tile.Body>
        </Tile>
      </div>
    </div>
  );
}

function DataTableExample({ tutorsData }: { tutorsData: UserType[] }) {
  const [searchFilter, setSearchFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const columns = [
    {
      header: 'Name',
      accessorKey: 'name',
      // cell: ({ row }: { row: { original: TutorTableData } }) => (
      //   <button
      //     className="bg-transparent font-semibold px-3 py-1 rounded"
      //     onClick={() => handleActionClick(row.original)}
      //   >
      //     {row.original.name}
      //   </button>
      // ),
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
      header: 'Status',
      accessorKey: 'status',
    },
    {
      header: 'Action',
      accessorKey: 'action',
      cell: () => {
        return (
          <div className="flex gap-2">
            {/* <Button
              variant="custom"
              size="custom"
              onClick={() => handleDeleteClass(row.original)}
              disabled={isMutating}
            >                
              <DeleteIcon />
            </Button> */}
          </div>
        );
      },
    },
  ];

  const filterOptions = [
    { label: 'All', value: 'all' },
    { label: 'Name', value: 'name' },
    { label: 'Email', value: 'email' },
    { label: 'Phone Number', value: 'phoneNumber' },
    { label: 'Status', value: 'status' },
  ];

  // Filter tutors based on search and filters (following AdminStudentPaymentsView pattern)
  const filteredTutors = useMemo(() => {
    return tutorsData.filter((tutor) => {
      // Filter by search query
      let matchesSearch = true;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const tutorName = tutor?.first_name
          ? `${tutor?.first_name} ${tutor?.last_name}`
          : '-';
        const tutorEmail = tutor?.email || '-';
        const tutorPhone = tutor?.phone_number || '-';
        const tutorStatus = tutor?.status || '-';

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
          case 'status':
            matchesSearch = tutorStatus.toLowerCase().includes(query);
            break;
          case 'all':
          default:
            matchesSearch =
              tutorName.toLowerCase().includes(query) ||
              tutorEmail.toLowerCase().includes(query) ||
              tutorPhone.toLowerCase().includes(query) ||
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

  // Map tutors to table data format (following AdminStudentPaymentsView pattern)
  const tableData: TutorTableData[] = paginatedData.map((tutor) => ({
    id: tutor?.id,
    name: tutor?.first_name ? `${tutor?.first_name} ${tutor?.last_name}` : '-',
    email: tutor?.email || '-',
    phoneNumber: tutor?.phone_number || '-',
    status: tutor?.status || '-',
    action: 'Manage',
  }));

  return (
    <div>
      <div className="flex justify-between items-center">
        <div className="flex gap-3 w-1/2">
          <SearchBar
            name="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search tutors by ${searchFilter === 'all' ? 'any field' : searchFilter}...`}
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
    </div>
  );
}
