'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';

import Tile from '~/core/ui/Tile';
import DataTable from '~/core/ui/DataTable';
import SearchBar from '../base/SearchBar';
import Filter from '../base/Filter';
import CreateClassModal from './CreateClassModal';
import useClassesDataQuery from '~/lib/classes/hooks/use-fetch-class';
import ClassType, { ClassTableData, ClassWithTutorAndEnrollment } from '~/lib/classes/types/class';
import UpdateClassModal from './UpdateClassModal';
import Button from '~/core/ui/Button';
import { DeleteIcon } from '~/assets/images/react-icons';
import useCsrfToken from '~/core/hooks/use-csrf-token';
import { deleteClassAction } from '~/lib/classes/server-actions';

export default function ClassesList() {  
  const { data: classes, error, isLoading, revalidate: revalidateClassesDataFetch } = useClassesDataQuery();

  console.log('classes', classes);

  if (isLoading) {
    return <div>Loading classes...</div>;
  }

  if (error) {
    return <div>Error fetching classes: {error.message}</div>;
  }

  if (!classes || classes.length === 0) {
    return <div>No classes found.</div>;
  }

  return (
    <div className={'flex flex-col space-y-6 pb-36'}>
      <div>
        <Tile>
          <Tile.Heading>Classes</Tile.Heading>
          <Tile.Body>
            <DataTableExample classesData={classes} revalidateClassesDataFetch={revalidateClassesDataFetch}/>
          </Tile.Body>
        </Tile>
      </div>
    </div>
  );
}
 
function DataTableExample({
  classesData, revalidateClassesDataFetch
}: {
  classesData: ClassWithTutorAndEnrollment[],
  revalidateClassesDataFetch: () => void;
}) {
  const [searchFilter, setSearchFilter] = useState('all');

  const [isMutating, startTransition] = useTransition();
  const csrfToken = useCsrfToken();

  function handleActionClick(rowData: ClassTableData) {
    window.location.href = `/classes/${rowData.id}`;
  }
  
  const handleDeleteClass = async (classData: ClassTableData) => {
    // Confirm deletion and then delete the class
    const confirmed = window.confirm(`Are you sure you want to delete ${classData.name}?`);
    if (confirmed) {
      try {
        startTransition(async () => {
          await deleteClassAction({ classId: classData.id, csrfToken});
          revalidateClassesDataFetch();
        });
        // await deleteClass(classData.id);
        console.log(`Class ${classData.name} deleted successfully`);
      } catch (error: any) {
        console.error(`Failed to delete class: ${error?.message}`);
      }
    }
  };
  
  const columns = [
    {
      header: 'Name',
      accessorKey: 'name',
      size: 240, // Fixed width,
      cell: ({ row }: { row: { original: ClassTableData } }) => (
        <button
          className="bg-transparent font-semibold px-3 py-1 rounded"
          onClick={() => handleActionClick(row.original)}
        >
          {row.original.name}
        </button>
      ),
    },
    {
      header: 'Tutor',
      accessorKey: 'tutor',
    },
    {
      header: 'Subject',
      accessorKey: 'subject',
    },
    {
      header: 'No of Students',
      accessorKey: 'noOfStudents',
    },
    {
      header: 'Action',
      accessorKey: 'action',
      cell: ({ row }: { row: { original: ClassTableData } }) => {
        const { id } = row.original;
        const classData = classesData.find((classData) => classData.id === id);
        if (classData) {
          return (
            <div className='flex gap-2'>
              <Button
                variant="custom"
                size="custom"
                disabled={isMutating}
              >
                <UpdateClassModal
                  classData={classData}
                />
              </Button>
              <Button
                variant="custom"
                size="custom"
                onClick={() => handleDeleteClass(row.original)}
                disabled={isMutating}
              >                
                <DeleteIcon />
              </Button>
            </div>
          );
        }
      },
    },
  ];

  const tableData: ClassTableData[] = classesData.map((classData) => ({
    id: classData?.id,
    name: classData?.name,
    tutor: `${classData?.tutor?.firstName} ${classData?.tutor?.lastName}`,
    subject: classData?.subject,
    noOfStudents: classData?.noOfStudents || 0,
    action: 'Manage',
  }))

  console.log("tableData",tableData)

  const filterOptions = [
    { label: 'All', value: 'all' },
    { label: 'Name', value: 'name' },
    { label: 'Subject', value: 'subject' },
    { label: 'Tutor', value: 'tutor' },
  ]
 
  return (
    <div className='flex flex-col gap-4'>
      <div className='flex justify-between items-center'>
        <div className='flex gap-3 w-1/2'>
          <SearchBar name="Search" />
          <Filter
            name="Search Filter"
            placeholder="Search by an attribute"
            width='150px'
            options={filterOptions}
            value={searchFilter}
            onChange={(value) => setSearchFilter(value)}
          />
        </div>
        <div>
          <CreateClassModal />
        </div>
      </div>
      <DataTable<ClassTableData> data={tableData} columns={columns} />
    </div>
  );
}