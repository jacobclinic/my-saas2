'use client';

import { useMemo, useState, useTransition } from 'react';

import Tile from '~/core/ui/Tile';
import DataTable from '~/core/ui/DataTable';
import Filter from '../base/Filter';
import SearchBar from '../base/SearchBar';
import UserType from '~/lib/user/types/user';
import useCsrfToken from '~/core/hooks/use-csrf-token';
import { StudentTableData } from '~/lib/user/types/student';
import Button from '~/core/ui/Button';
import { DeleteIcon } from '~/assets/images/react-icons';
import CreateUserModal from '../base/CreateUserModal';
import { USER_ROLES } from '~/lib/constants';

export default function StudentsList({ studentsData}: { studentsData: UserType[] }) { 

  return (
    <div className={'flex flex-col space-y-6 pb-36'}>
      <div>
        <Tile>
          <Tile.Heading>Students</Tile.Heading>

          <Tile.Body>
            <DataTableExample studentsData={studentsData}/>
          </Tile.Body>
        </Tile>
      </div>
    </div>
  );
}
 
function DataTableExample({ studentsData}: { studentsData: UserType[] }) {
  const [searchFilter, setSearchFilter] = useState('all');

  const [isMutating, startTransition] = useTransition();
  const csrfToken = useCsrfToken();

  function handleActionClick(rowData: StudentTableData) {
    window.location.href = `/students/${rowData.id}`;
  }
  
  const handleDeleteClass = async (studentData: StudentTableData) => {
    // Confirm deletion and then delete the class
    const confirmed = window.confirm(`Are you sure you want to delete ${studentData.name}?`);
    if (confirmed) {
      try {
        startTransition(async () => {
          // await deleteSessionAction({ sessionId: studentData.id, csrfToken});
          // revalidateSessionsByClassIdDataFetch && revalidateSessionsByClassIdDataFetch();
        });
        // await deleteClass(studentData.id);
        console.log(`Class ${studentData.name} deleted successfully`);
      } catch (error: any) {
        console.error(`Failed to delete class: ${error?.message}`);
      }
    }
  };

  const columns = [
    {
      header: 'Name',
      accessorKey: 'name',
      // cell: ({ row }: { row: { original: StudentTableData } }) => (
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
      cell: ({ row }: { row: { original: StudentTableData } }) => {
        const { id } = row.original;
        const studentData = studentsData.find((studentData) => studentData.id === id);
        if (studentData) {
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

  const tableData: StudentTableData[] = studentsData.map((studentData) => ({
    id: studentData?.id,
    name: studentData?.first_name ? `${studentData?.first_name} ${studentData?.last_name}` : "-",
    email: studentData?.email || "-",
    phoneNumber: studentData?.phone_number || "-",
    status: studentData?.status || "-",
    action: 'Manage',
  }));

  const filterOptions = [
    { label: 'All', value: 'all' },
    { label: 'Class', value: 'class' },
    { label: 'Tutor', value: 'tutor' },
    { label: 'Student', value: 'student' },
  ]
 
  return (
    <div>
      <div className="flex justify-between items-center">
        <div className="flex gap-3 w-1/2">
          <SearchBar name="Search" />
          <Filter
            name="Search Filter"
            placeholder="Search by an attribute"
            width="150px"
            options={filterOptions}
            value={searchFilter}
          />
        </div>
        <CreateUserModal userRole={USER_ROLES.STUDENT}/>
      </div>
      <DataTable data={tableData} columns={columns} />
    </div>
  );
}