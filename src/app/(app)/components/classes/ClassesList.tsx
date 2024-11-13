'use client';

import { Line, ResponsiveContainer, LineChart, XAxis } from 'recharts';
import { useMemo } from 'react';

import Tile from '~/core/ui/Tile';
import DataTable from '~/core/ui/DataTable';
import SearchBar from '../base/SearchBar';
import Filter from '../base/Filter';
import ModalComponent from '../base/ModalComponent';
import { TextFieldInput, TextFieldLabel } from '~/core/ui/TextField';
import CreateClassModal from './CreateClassModal';

export default function ClassesList() {
  const mrr = useMemo(() => generateDemoData(), []);
  const visitors = useMemo(() => generateDemoData(), []);
  const returningVisitors = useMemo(() => generateDemoData(), []);
  const churn = useMemo(() => generateDemoData(), []);
  const netRevenue = useMemo(() => generateDemoData(), []);
  const fees = useMemo(() => generateDemoData(), []);
  const newCustomers = useMemo(() => generateDemoData(), []);
  const tickets = useMemo(() => generateDemoData(), []);
  const activeUsers = useMemo(() => generateDemoData(), []);

  return (
    <div className={'flex flex-col space-y-6 pb-36'}>
      <div>
        <Tile>
          <Tile.Heading>Classes</Tile.Heading>

          <Tile.Body>
            <DataTableExample />
          </Tile.Body>
        </Tile>
      </div>
    </div>
  );
}

function generateDemoData() {
  const today = new Date();
  const formatter = new Intl.DateTimeFormat('en-us', {
    month: 'long',
    year: '2-digit',
  });

  const data: { value: string; name: string }[] = [];

  for (let n = 8; n > 0; n -= 1) {
    const date = new Date(today.getFullYear(), today.getMonth() - n, 1);

    data.push({
      name: formatter.format(date) as string,
      value: (Math.random() * 10).toFixed(1),
    });
  }

  return [data, data[data.length - 1].value] as [typeof data, string];
}
 
function DataTableExample() {
  const columns = [
    {
      header: 'Name',
      accessorKey: 'name',
      size: 240, // Fixed width,
    },
    {
      header: 'Tutor',
      accessorKey: 'tutor',
    },
    {
      header: 'No of Students',
      accessorKey: 'noOfStudents',
    },
    {
      header: 'Next Session',
      accessorKey: 'nextSession',
    },
    {
      header: 'Action',
      accessorKey: 'action',
    },
  ];
 
  const data = [
    {
      name: 'Economics - 2024 A/L - Group 1',
      tutor: 'Hashini Daluwatta',
      noOfStudents: 10,
      nextSession: 20,
      action: 'View',
    },
    {name: 'Mathematics - 2024 O/L - Group A',
      tutor: 'John Doe',
      noOfStudents: 15,
      nextSession: 15,
      action: 'View',
    },
    {
      name: 'Physics - 2023 A/L - Group B',
      tutor: 'Jane Doe',
      noOfStudents: 12,
      nextSession: 10,
      action: 'View',
    },
    {
      name: 'Chemistry - 2024 O/L - Group C',
      tutor: 'John Smith',
      noOfStudents: 18,
      nextSession: 25,
      action: 'View',
    },
    {
      name: 'Biology - 2023 A/L - Group D',
      tutor: 'Alice Johnson',
      noOfStudents: 22,
      nextSession: 18,
      action: 'View',
    },
    {
      name: 'History - 2024 O/L - Group E',
      tutor: 'Bob Smith',
      noOfStudents: 16,
      nextSession: 12,
      action: 'View',
    },
    {
      name: 'Geography - 2023 A/L - Group F',
      tutor: 'Charlie Brown',
      noOfStudents: 10,
      nextSession: 8,
      action: 'View',
    },
    {
      name: 'English Literature - 2024 O/L - Group G',
      tutor: 'David Lee',
      noOfStudents: 25,
      nextSession: 20,
      action: 'View',
    },
    {
      name: 'ICT - 2023 A/L - Group H',
      tutor: 'Emily Davis',
      noOfStudents: 18,
      nextSession: 15,
      action: 'View',
    },
    {
      name: 'ICT - 2023 A/L - Group H',
      tutor: 'Emily Davis',
      noOfStudents: 18,
      nextSession: 15,
      action: 'View',
    }
  ];

  const filterOptions = [
    { label: 'All', value: 'all' },
    { label: 'Class', value: 'class' },
    { label: 'Tutor', value: 'tutor' },
    { label: 'Student', value: 'student' },
  ]
 
  return (
    <div className='flex flex-col gap-4'>
      <div className='flex justify-between items-center'>
        <div className='flex gap-3 w-1/2'>
          <SearchBar name="Search" />
          <Filter name="Search Filter" placeholder="Search by an attribute" width='150px' options={filterOptions}/>
        </div>
        <CreateClassModal />
      </div>
      <DataTable data={data} columns={columns} />
    </div>
  );
}