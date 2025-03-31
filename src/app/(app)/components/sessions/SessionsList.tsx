'use client';

import Tile from '~/core/ui/Tile';
import DataTable from '~/core/ui/DataTable';
import { useState, useTransition } from 'react';
import { SessionsWithTableData, SessionTableData } from '~/lib/sessions/types/session';
import SearchBar from '../base-v2/ui/SearchBar';
import Filter from '../base/Filter';
import CreateSessionModal from './CreateSessionModal';
// import useSessionsDataQuery from '~/lib/sessions/hooks/use-fetch-session';
import Button from '~/core/ui/Button';
import { DeleteIcon } from '~/assets/images/react-icons';
import useCsrfToken from '~/core/hooks/use-csrf-token';
// import UpdateSessionModal from './UpdateSessionModal';
import { deleteSessionAction } from '~/lib/sessions/server-actions';

export default function SessionsList({ sessionData, classId, revalidateSessionsByClassIdDataFetch }: {
  sessionData: SessionsWithTableData[],
  classId?: string,
  revalidateSessionsByClassIdDataFetch? : () => void,
}) {
  // const { data: sessions, error, isLoading, revalidate: revalidateSessionsDataFetch } = useSessionsDataQuery();

  // console.log('sessions', sessions);

  // if (isLoading) {
  //   return <div>Loading sessions...</div>;
  // }

  // if (error) {
  //   return <div>Error fetching sessions: {error.message}</div>;
  // }

  // if (!sessions || sessions.length === 0) {
  //   return <div>No sessions found.</div>;
  // }

  return (
    <div className={'flex flex-col space-y-6 pb-36'}>
      <div>
        <Tile>
          <Tile.Heading>Sessions</Tile.Heading>
          <Tile.Body>
            <DataTableExample sessionsData={sessionData} classId={classId} revalidateSessionsByClassIdDataFetch={revalidateSessionsByClassIdDataFetch}/>
          </Tile.Body>
        </Tile>
      </div>
    </div>
  );
}
 
function DataTableExample({
  sessionsData, classId, revalidateSessionsByClassIdDataFetch
}: {
  sessionsData: SessionsWithTableData[];
  classId?: string;
  revalidateSessionsByClassIdDataFetch?: () => void;
}) {
  const [searchFilter, setSearchFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');

  const [isMutating, startTransition] = useTransition();
  const csrfToken = useCsrfToken();

  function handleActionClick(rowData: SessionTableData) {
    window.location.href = `/sessions/${rowData.id}`;
  }
  
  const handleDeleteClass = async (sessionData: SessionTableData) => {
    // Confirm deletion and then delete the class
    const confirmed = window.confirm(`Are you sure you want to delete ${sessionData.date}?`);
    if (confirmed) {
      try {
        startTransition(async () => {
          await deleteSessionAction({ sessionId: sessionData.id, csrfToken});
          revalidateSessionsByClassIdDataFetch && revalidateSessionsByClassIdDataFetch();
        });
        // await deleteClass(sessionData.id);
        // console.log(`Class ${sessionData.date} deleted successfully`);
      } catch (error: any) {
        console.error(`Failed to delete class: ${error?.message}`);
      }
    }
  };
  
  const allColumns = [
    {
      header: 'Date',
      accessorKey: 'date',
      // size: 200, // Fixed width,
      cell: ({ row }: { row: { original: SessionTableData } }) => (
        <button
          className="bg-transparent font-semibold px-3 py-1 rounded"
          onClick={() => handleActionClick(row.original)}
        >
          {new Date(row.original.date).toLocaleDateString()}
        </button>
      ),
    },
    {
      header: 'Class',
      accessorKey: 'class',
    },
    {
      header: 'Tutor',
      accessorKey: 'tutor',
    },
    {
      header: 'Total Students',
      accessorKey: 'noOfStudents',
      size: 100, // Fixed width,
    },
    {
      header: 'Attended Students',
      accessorKey: 'noOfAtendedStudents',
      size: 100, // Fixed width,
    },
    {
      header: 'Action',
      accessorKey: 'action',
      cell: ({ row }: { row: { original: SessionTableData } }) => {
        const { id } = row.original;
        const sessionData = sessionsData.find((sessionData) => sessionData.id === id);
        if (sessionData) {
          return (
            <div className='flex gap-2'>
              <Button
                variant="custom"
                size="custom"
                disabled={isMutating}
              >
                {/* <UpdateSessionModal
                  sessionData={sessionData}
                  revalidateSessionsByClassIdDataFetch={revalidateSessionsByClassIdDataFetch}
                /> */}
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
    }
  ];

  // Filter out the "Class" column if classId is provided
  const columns = classId
    ? allColumns.filter((column) => column.accessorKey !== 'class')
    : allColumns;

  const tableData: SessionTableData[] = sessionsData.map((sessionData) => ({
    id: sessionData?.id,
    date: sessionData?.startTime,
    class: sessionData?.class?.name,
    tutor: `${sessionData?.class?.tutor?.firstName} ${sessionData?.class?.tutor?.lastName}`,
    noOfStudents: sessionData?.class?.noOfStudents,
    noOfAtendedStudents: sessionData?.noOfAtendedStudents,
    action: 'Manage',
  }))

  const filterOptions = [
    { label: 'All', value: 'all' },
    { label: 'Tutor', value: 'tutor' },
    { label: 'Class', value: 'class' },
  ]

  const timeFilterOptions = [
    { label: 'All Time', value: 'all' },
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'thisWeek' },
    { label: 'This Month', value: 'thisMonth' },
  ]
 
  return (
    <div className='flex flex-col gap-4'>
      <div className='flex justify-between items-center gap-24'>
        <div className='flex gap-3 w-1/2'>
          <SearchBar name="Search" placeholder='Enter a search term'/>
          <Filter
            name="Search Filter"
            placeholder="Search by an attribute"
            width='150px'
            options={filterOptions}
            value={searchFilter}
            onChange={(value) => setSearchFilter(value)}
          />
        </div>
        <div className='flex gap-3 w-1/2'>
          <Filter
            name="Time Filter"
            placeholder="Search by an attribute"
            width='150px'
            options={timeFilterOptions}
            value={timeFilter}
            onChange={(value) => setTimeFilter(value)}
          />
          <div className=' self-end w-[250px]'>
            <CreateSessionModal classId={classId} revalidateSessionsByClassIdDataFetch={revalidateSessionsByClassIdDataFetch}/>
          </div>
        </div>
      </div>
      <DataTable<SessionTableData> data={tableData} columns={columns} />
    </div>
  );
}