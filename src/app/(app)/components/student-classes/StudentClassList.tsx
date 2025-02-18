// components/classes/StudentClassList.tsx
'use client'

import React, { useEffect, useState } from 'react';
import {
  Search
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../base-v2/ui/Select';
import { Input } from '../base-v2/ui/Input';
import StudentClassCard from './StudentClassCard';
import { ClassForStudentType, StudentClassListType } from '~/lib/classes/types/class-v2';

const StudentClassesList = ({ studentClassesData }: { studentClassesData: ClassForStudentType[] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('all');
  const [classTableData, setClassTableData] = useState<StudentClassListType[]>([]);

  useEffect(() => {
    if (studentClassesData) {
        const formattedData = studentClassesData.map((classData) => {
            return {
                id: classData.id || "",
                name: classData.class.name || "",
                schedule: "test parameter",
                subject: classData.class.subject || "",
                status: classData.class.status || "",
                students: 10,
                grade: classData.class.grade || "",
                fee: classData.class.fee || 0,
                payments: [],
            }
        })
      setClassTableData(formattedData);
    }
  }, [studentClassesData]);

  return (
    <div className="p-6 max-w-6xl xl:min-w-[900px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Your Classes</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search classes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            <SelectItem value="2024/2025">2024/2025</SelectItem>
            <SelectItem value="2023/2024">2023/2024</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Classes List */}
      <div className='lg:min-w-[600px]'>
        {classTableData
          .filter(cls => {
            if (searchQuery) {
              if (!cls?.name) return false;
              return cls.name.toLowerCase().includes(searchQuery.toLowerCase());
            }
            if (selectedYear !== 'all') {
              return cls.grade === selectedYear;
            }
            return true;
          })
          .map(classData => (
            <StudentClassCard 
              key={classData.id} 
              classData={classData}
            />
          ))
        }
      </div>
    </div>
    
  );
};

export default StudentClassesList;