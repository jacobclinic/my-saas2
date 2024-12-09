'use client';

import Tile from '~/core/ui/Tile';
import DataTable from '~/core/ui/DataTable';
import { useState } from 'react';
import { SessionTableData } from '~/lib/sessions/types/session';
import SearchBar from '../base/SearchBar';
import Filter from '../base/Filter';
import CreateSessionModal from './CreateSessionModal';

export default function SessionsList() {

  return (
    <div className={'flex flex-col space-y-6 pb-36'}>
      <div>
        <Tile>
          <Tile.Heading>Sessions</Tile.Heading>

          <Tile.Body>
            <DataTableExample />
          </Tile.Body>
        </Tile>
      </div>
    </div>
  );
}
 
function DataTableExample() {
  const [searchFilter, setSearchFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  
  const columns = [
    {
      header: 'Date',
      accessorKey: 'date',
      size: 200, // Fixed width,
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
      header: 'Subject',
      accessorKey: 'subject',
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
        return (
          <button className="p-2 text-black font-bold hover:text-black">
            ⋮
          </button>
        );
      }
    }
  ];
 
  const sampleTableData: SessionTableData[] = [
    {
      id: '1',
      date: "2024-12-04 17:30 PM",
      class: "Economics - 2023",
      tutor: 'Hashini Daluwatta',
      subject: 'Economics',
      noOfStudents: 10,
      noOfAtendedStudents: 3,
      action: 'View',
    },
    {
      id: '94',
      date: "2024-12-04 17:30 PM",
      class: "Chemistry - 2009",
      tutor: "David Lee",
      subject: "Biology",
      noOfStudents: 14,
      noOfAtendedStudents: 6,
      action: 'View'
    },
    {
      id: '71',
      date: "2024-12-04 17:30 PM",
      class: "History - 2014",
      tutor: "Jane Doe",
      subject: "Mathematics",
      noOfStudents: 19,
      noOfAtendedStudents: 7,
      action: 'View'
    },
    {
      id: '86',
      date: "2024-12-04 17:30 PM",
      class: "Mathematics - 2007",
      tutor: "John Doe",
      subject: "Chemistry",
      noOfStudents: 11,
      noOfAtendedStudents: 3,
      action: 'View'
    },
  ];

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
      <div className='flex justify-between items-center'>
        <div className='flex gap-3 w-1/2'>
          <SearchBar name="Search" plaseholder='Enter a search term'/>
          <Filter
            name="Search Filter"
            placeholder="Search by an attribute"
            width='150px'
            options={filterOptions}
            value={searchFilter}
            onChange={(value) => setSearchFilter(value)}
          />
        </div>
        <div className='flex gap-3'>
          <Filter
            name="Time Filter"
            placeholder="Search by an attribute"
            width='150px'
            options={timeFilterOptions}
            value={timeFilter}
            onChange={(value) => setTimeFilter(value)}
          />
          <CreateSessionModal />
        </div>
      </div>
      <DataTable<SessionTableData> data={sampleTableData} columns={columns} />
    </div>
  );
}