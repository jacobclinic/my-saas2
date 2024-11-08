'use client';

import { Line, ResponsiveContainer, LineChart, XAxis } from 'recharts';
import { useMemo } from 'react';

import Tile from '~/core/ui/Tile';
import DataTable from '~/core/ui/DataTable';

export default function StudentsList() {
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
          <Tile.Heading>Students</Tile.Heading>

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
    },
    {
      header: 'No of Students',
      accessorKey: 'noOfStudents',
    },
    {
      header: 'No of Classes',
      accessorKey: 'noOfClasses',
    },
    {
      header: 'No of Sessions',
      accessorKey: 'noOfSessions',
    },
    {
      header: 'Action',
      accessorKey: 'action',
    },
  ];
 
  const data = [
    {
      name: 'Hashini Daluwatta',
      noOfStudents: 10,
      noOfClasses: 5,
      noOfSessions: 20,
      action: 'View',
    },
    {
      name: 'John Doe',
      noOfStudents: 15,
      noOfClasses: 8,
      noOfSessions: 30,
      action: 'View',
    },
    {
      name: 'Jane Doe',
      noOfStudents: 12,
      noOfClasses: 6,
      noOfSessions: 24,
      action: 'View',
    },
    {
      name: 'John Smith',
      noOfStudents: 18,
      noOfClasses: 10,
      noOfSessions: 40,
      action: 'View',
    },
    {
      name: 'Alice Johnson',
      noOfStudents: 22,
      noOfClasses: 12,
      noOfSessions: 48,
      action: 'View'
    },
    {
      name: 'Bob Smith',
      noOfStudents: 16,
      noOfClasses: 9,
      noOfSessions: 36,
      action: 'View'
    },
    {
      name: 'Charlie Brown',
      noOfStudents: 10,
      noOfClasses: 5,
      noOfSessions: 20,
      action: 'View'
    },
    {
      name: 'David Lee',
      noOfStudents: 25,
      noOfClasses: 15,
      noOfSessions: 60,
      action: 'View'
    },
    {
      name: 'Emily Davis',
      noOfStudents: 18,
      noOfClasses: 10,
      noOfSessions: 40,
      action: 'View'
    },
    {
      name: 'Frank Miller',
      noOfStudents: 12,
      noOfClasses: 6,
      noOfSessions: 24,
      action: 'View'
    },
  ];
 
  return <DataTable data={data} columns={columns} />;
}