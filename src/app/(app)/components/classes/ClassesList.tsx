'use client';

import { Line, ResponsiveContainer, LineChart, XAxis } from 'recharts';
import { useMemo, useState } from 'react';

import Tile from '~/core/ui/Tile';
import DataTable from '~/core/ui/DataTable';
import SearchBar from '../base/SearchBar';
import Filter from '../base/Filter';
import ModalComponent from '../base/ModalComponent';
import { TextFieldInput, TextFieldLabel } from '~/core/ui/TextField';
import CreateClassModal from './CreateClassModal';

type ClassData = {
  id: string;
  name: string | JSX.Element; // Allow both string and JSX.Element for flexibility
  tutor: string;
  subject: string;
  noOfStudents: number;
  action: string;
};

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

function handleActionClick(rowData: ClassData) {
  window.location.href = `/classes/${rowData.id}`;
}
 
function DataTableExample() {
  const [searchFilter, setSearchFilter] = useState('all');
  const columns = [
    {
      header: 'Name',
      accessorKey: 'name',
      size: 240, // Fixed width,
      cell: ({ row }: { row: { original: ClassData } }) => (
        row.original.name // Render JSX if it's not a string
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
      cell: ({ row }: { row: { original: ClassData } }) => (
        <button
          className="bg-blue-500 text-white px-3 py-1 rounded"
          onClick={() => handleActionClick(row.original)}
        >
          View
        </button>
      ),
    },
  ];
 
  const data: ClassData[] = [
    {
      id: '1',
      name: 'Economics - 2024 A/L - Group 1',
      tutor: 'Hashini Daluwatta',
      subject: 'Economics',
      noOfStudents: 10,
      action: 'View',
    },
    {
      id: '2',
      name: 'Mathematics - 2024 O/L - Group A',
      tutor: 'John Doe',
      subject: 'Mathematics',
      noOfStudents: 15,
      action: 'View'
    },
    {
      id: '3',
      name: 'Physics - 2023 A/L - Group B',
      tutor: 'Jane Doe',
      subject: 'Physics',
      noOfStudents: 12,
      action: 'View'
    },
    {
      id: '4',
      name: 'Chemistry - 2024 O/L - Group C',
      tutor: 'John Smith',
      subject: 'Chemistry',
      noOfStudents: 18,
      action: 'View'
    },
    {
      id: '5',
      name: 'Biology - 2023 A/L - Group D',
      tutor: 'Alice Johnson',
      subject: 'Biology',
      noOfStudents: 22,
      action: 'View'
    },
    {
      id: '6',
      name: 'History - 2024 O/L - Group E',
      tutor: 'Bob Smith',
      subject: 'History',
      noOfStudents: 16,
      action: 'View'
    },
    {
      id: '7',
      name: 'Geography - 2023 A/L - Group F',
      tutor: 'Charlie Brown',
      subject: 'Geography',
      noOfStudents: 10,
      action: 'View'
    },
    {
      id: '8',
      name: 'English Literature - 2024 O/L - Group G',
      tutor: 'David Lee',
      subject: 'English Literature',
      noOfStudents: 25,
      action: 'View'
    },
    {
      id: '9',
      name: 'ICT - 2023 A/L - Group H',
      tutor: 'Emily Davis',
      subject: 'ICT',
      noOfStudents: 18,
      action: 'View'
    },
    {
      id: '10',
      name: 'Accounting - 2024 A/L - Group I',
      tutor: 'Frank Miller',
      subject: 'Accounting',
      noOfStudents: 12,
      action: 'View'
    },
  ];

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
        <CreateClassModal />
      </div>
      <DataTable<ClassData> data={data} columns={columns} />
    </div>
  );
}