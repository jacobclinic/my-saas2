'use client';

import { useMemo, useState, useTransition } from 'react';

import Tile from '~/core/ui/Tile';
import DataTable from '~/core/ui/DataTable';
import Filter from '../base/Filter';
import SearchBar from '../base-v2/ui/SearchBar';
import { TutorTableData } from '~/lib/user/types/tutor';
import UserType from '~/lib/user/types/user';
import useCsrfToken from '~/core/hooks/use-csrf-token';
import Button from '~/core/ui/Button';
import { DeleteIcon } from '~/assets/images/react-icons';
import { USER_ROLES } from '~/lib/constants';
import CreateUserModal from '../base/CreateUserModal';
import { useTablePagination } from '~/core/hooks/use-table-pagination';

export default function TutorsList({ tutorsData}: { tutorsData: UserType[] }) { 
  return (
    <div className={'flex flex-col space-y-6 pb-36 h-[calc(100dvh-100px)]'}>
      <div>
        <Tile>
          <Tile.Heading>Tutors</Tile.Heading>

          <Tile.Body>
            <DataTableExample tutorsData={tutorsData}/>
          </Tile.Body>
        </Tile>
      </div>
    </div>
  );
}
 
function DataTableExample({ tutorsData}: { tutorsData: UserType[] }) {
  const [searchFilter, setSearchFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMutating, startTransition] = useTransition();
  const csrfToken = useCsrfToken();

  function handleActionClick(rowData: TutorTableData) {
    window.location.href = `/tutors/${rowData.id}`;
  }
  
  const handleDeleteClass = async (tutorData: TutorTableData) => {
    // Confirm deletion and then delete the class
    const confirmed = window.confirm(`Are you sure you want to delete ${tutorData.name}?`);
    if (confirmed) {
      try {
        startTransition(async () => {
          // await deleteSessionAction({ sessionId: tutorData.id, csrfToken});
          // revalidateSessionsByClassIdDataFetch && revalidateSessionsByClassIdDataFetch();
        });
        // await deleteClass(tutorData.id);
        console.log(`Class ${tutorData.name} deleted successfully`);
      } catch (error: any) {
        console.error(`Failed to delete class: ${error?.message}`);
      }
    }
  };

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
      cell: ({ row }: { row: { original: TutorTableData } }) => {
        const { id } = row.original;
        const tutorData = tutorsData.find((tutorData) => tutorData.id === id);
        if (tutorData) {
          return (
            <div className='flex gap-2'>
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
        }
      },
    },
  ];

  const tableData: TutorTableData[] = tutorsData.map((tutorData) => ({
    id: tutorData?.id,
    name: tutorData?.first_name ? `${tutorData?.first_name} ${tutorData?.last_name}` : "-",
    email: tutorData?.email || "-",
    phoneNumber: tutorData?.phone_number || "-",
    status: tutorData?.status || "-",
    action: 'Manage',
  }));

  const filterOptions = [
    { label: 'All', value: 'all' },
    { label: 'Name', value: 'name' },
    { label: 'Email', value: 'email' },
    { label: 'Phone Number', value: 'phoneNumber' },
    { label: 'Status', value: 'status' },
  ];

  const filteredData = useMemo(() => {
    const testData = [...tableData, ...tableData, ...tableData, ...tableData, ...tableData, ...tableData, ...tableData, ...tableData, ...tableData, ...tableData];
    return testData.filter((tutor) => {
      if (!searchQuery) return true;
      
      const searchTerm = searchQuery.toLowerCase();

      switch (searchFilter) {
        case 'name':
          return tutor.name.toLowerCase().includes(searchTerm);
        case 'email':
          return tutor.email.toLowerCase().includes(searchTerm);
        case 'phoneNumber':
          return tutor.phoneNumber.toLowerCase().includes(searchTerm);
        case 'status':
          return tutor.status.toLowerCase().includes(searchTerm);
        case 'all':
        default:
          return (
            tutor.name.toLowerCase().includes(searchTerm) ||
            tutor.email.toLowerCase().includes(searchTerm) ||
            tutor.phoneNumber.toLowerCase().includes(searchTerm) ||
            tutor.status.toLowerCase().includes(searchTerm)
          );
      }
    });
  }, [tableData, searchQuery, searchFilter]);

  const {
    paginatedData,
    pageIndex,
    pageSize,
    pageCount,
    handlePaginationChange,
  } = useTablePagination({ data: filteredData });

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
        <CreateUserModal userRole={USER_ROLES.TUTOR}/>
      </div>
      <DataTable 
        data={paginatedData} 
        columns={columns}
        pageIndex={pageIndex}
        pageSize={pageSize}
        pageCount={pageCount}
        onPaginationChange={handlePaginationChange}
      />
    </div>
  );
}