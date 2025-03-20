'use client'

import React, { useEffect, useState } from 'react';
import { Button } from "../base-v2/ui/Button";
import { Input } from "../base-v2/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../base-v2/ui/Select";
import {
  Plus,
  Search,
} from 'lucide-react';
import { format as dateFnsFormat } from "date-fns";
import { LinkCopiedState, ClassListData, ClassType } from '~/lib/classes/types/class-v2';
import ClassCard from './ClassCard';
import CreateClassDialog from './CreateClassDialog';
import { GRADES } from '~/lib/constants-v2';

const TutorClasses = ({ classesData, userRole, tutorId } : { classesData: ClassType[], userRole: string, tutorId?: string }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('all');
  const [linkCopied, setLinkCopied] = useState<LinkCopiedState>({});
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [classTableData, setClassTableData] = useState<ClassListData[]>([]);

  useEffect(() => {
    if (classesData) {
      const formattedData = classesData.map((classData) => {
        // Ensure time_slots is an array before reducing
        const schedule = classData?.time_slots?.reduce((acc: string, slot: any, index: number, array) => {
          const timeSlotString = `${slot.day}, ${slot.time}`;
          // Add a separator for all except the last item
          return acc + timeSlotString + (index < array.length - 1 ? "; " : "");
        }, "") || "No schedule available";

        const formattedDate = classData?.upcomingSession
          ? dateFnsFormat(new Date(classData.upcomingSession), "EEE, MMM dd, yyyy")
          : "No upcoming session";
  
        return {
          id: classData.id,
          name: classData?.name || "No name provided",
          schedule,
          status: classData?.status || "Unknown",
          students: classData?.students?.length || 0,
          grade: classData?.grade || "N/A",
          registrationLink: "",
          nextClass: formattedDate,
          classRawData: classData,
        };
      });
      setClassTableData(formattedData);
    }
  }, [classesData]);


  console.log('classesData:', classesData);


  // Sample class data with Sri Lankan context
  const classesSampleData: ClassListData[] = [
    {
      id: "1",
      name: "2025 A/L Accounting - Batch 1",
      schedule: "Every Monday and Wednesday, 4:00 PM",
      status: "Active",
      students: 25,
      grade: "2024/2025",
      registrationLink: "https://commaeducation.com/classes/123/register",
      nextClass: "Mon, Dec 18, 2024"
    },
    {
      id: "2",
      name: "2024 A/L Accounting Revision - Batch 2",
      schedule: "Every Tuesday and Thursday, 2:00 PM",
      status: "Active",
      students: 18,
      grade: "2023/2024",
      registrationLink: "https://commaeducation.com/classes/456/register",
      nextClass: "Tue, Dec 19, 2024"
    }
  ];

  const handleCopyLink = (classId: string, link?: string): void => {
    if (link) {
      navigator.clipboard.writeText(link);
      setLinkCopied({ ...linkCopied, [classId]: true });
      setTimeout(() => {
        setLinkCopied({ ...linkCopied, [classId]: false });
      }, 2000);
    }
  };

  return (
    <div className="p-6 max-w-6xl xl:min-w-[900px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Your Classes</h1>
        {userRole !== 'student' ? <Button onClick={() => setShowCreateClass(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Class
        </Button> : null}
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
            {GRADES.map(grade => {
              return (
                <SelectItem key={grade} value={grade}>{grade}</SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Classes List */}
      <div>
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
            <ClassCard 
              key={classData.id} 
              classData={classData}
              showViewDetails={false}
            />
          ))
        }
      </div>

      {/* Dialogs */}
      <CreateClassDialog
        open={showCreateClass}
        onClose={() => setShowCreateClass(false)}
        tutorId={tutorId || classesData?.[0]?.tutor_id}
      />
    </div>
  );
};

export default TutorClasses;