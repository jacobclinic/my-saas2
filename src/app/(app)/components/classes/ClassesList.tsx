'use client'

import React, { useEffect, useState, useCallback } from 'react';
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

const TutorClasses = ({ 
  classesData, 
  userRole, 
  tutorId,
  setFilteredData,
  allClassesData
}: { 
  classesData: ClassType[], 
  userRole: string, 
  tutorId?: string,
  setFilteredData: React.Dispatch<React.SetStateAction<ClassType[]>>,
  allClassesData: ClassType[]
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('all');
  const [linkCopied, setLinkCopied] = useState<LinkCopiedState>({});
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [classTableData, setClassTableData] = useState<ClassListData[]>([]);

  // Format the current page data for display
  useEffect(() => {
    if (classesData) {
      const formattedData = classesData.map((classData) => {
        // Ensure time_slots is an array before reducing
        const schedule = classData?.time_slots?.reduce((acc: string, slot: any, index: number, array) => {
          const timeSlotString = `${slot.day}, ${slot.startTime} - ${slot.endTime}`;
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

  // Memoize the filter function to avoid reruns
  const applyFilters = useCallback(() => {
    const filtered = allClassesData.filter(cls => {
      const nameMatch = searchQuery 
        ? (cls?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
        : true;
        
      const yearMatch = selectedYear !== 'all'
        ? cls.grade === selectedYear
        : true;
        
      return nameMatch && yearMatch;
    });
    
    setFilteredData(filtered);
  }, [searchQuery, selectedYear, allClassesData, setFilteredData]);

  // Apply filters when search query or year selection changes
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

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
        {classTableData.length > 0 ? (
          classTableData.map((classData: ClassListData) => (
            <ClassCard 
              key={classData.id} 
              classData={classData}
              showViewDetails={false}
            />
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            No classes match your search criteria.
          </div>
        )}
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