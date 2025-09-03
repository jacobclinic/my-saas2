'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '../base-v2/ui/Button';
import { Input } from '../base-v2/ui/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../base-v2/ui/Select';
import { Plus, Search } from 'lucide-react';
import { format as dateFnsFormat } from 'date-fns';
import {
  LinkCopiedState,
  ClassListData,
  ClassType,
} from '~/lib/classes/types/class-v2';
import ClassCard from './ClassCard';
import CreateClassDialog from './CreateClassDialog';
import { GRADES } from '~/lib/constants-v2';
import AppHeader from '../AppHeader';
import UserType from '~/lib/user/types/user';

const TutorClasses = ({
  classesData,
  userRole,
  tutorId,
  tutorProfile,
  setFilteredData,
  allClassesData,
}: {
  classesData: ClassType[];
  userRole: string;
  tutorId?: string;
  tutorProfile?: UserType | null;
  setFilteredData: React.Dispatch<React.SetStateAction<ClassType[]>>;
  allClassesData: ClassType[];
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [classTableData, setClassTableData] = useState<ClassListData[]>([]);

  // Format the current page data for display
  useEffect(() => {
    if (classesData) {
      const formattedData = classesData.map((classData) => {
        // Ensure time_slots is an array before reducing
        const schedule =
          classData?.time_slots?.reduce(
            (acc: string, slot: any, index: number, array) => {
              const timeSlotString = `${slot.day}, ${slot.startTime} - ${slot.endTime}`;
              // Add a separator for all except the last item
              return (
                acc + timeSlotString + (index < array.length - 1 ? '; ' : '')
              );
            },
            '',
          ) || 'No schedule available';

        const formattedDate = classData?.upcomingSession
          ? dateFnsFormat(
              new Date(classData.upcomingSession),
              'EEE, MMM dd, yyyy',
            )
          : 'No upcoming session';

        return {
          id: classData.id,
          name: classData?.name || 'No name provided',
          schedule,
          status: classData?.status || 'Unknown',
          students: classData?.students?.length || 0,
          grade: classData?.grade || 'N/A',
          registrationLink: '',
          shortUrl: classData?.short_url_code || '',
          nextClass: formattedDate,
          tutor: {
            id: classData?.tutor_id || '',
            firstName: classData?.tutor?.first_name || 'Unknown',
            lastName: classData?.tutor?.last_name || 'Unknown',
          },
          classRawData: classData,
        };
      });
      setClassTableData(formattedData);
    }
  }, [classesData]);

  // Memoize the filter function to avoid reruns
  const applyFilters = useCallback(() => {
    const filtered = allClassesData.filter((cls) => {
      const nameMatch = searchQuery
        ? (cls?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
        : true;

      const yearMatch =
        selectedYear !== 'all' ? cls.grade === selectedYear : true;

        const statusMatch =
        selectedStatus === 'all'
          ? true
          : (cls.status || '').toLowerCase() === selectedStatus.toLowerCase();
      return nameMatch && yearMatch && statusMatch;
    });

    setFilteredData(filtered);
  }, [searchQuery, selectedYear, allClassesData, selectedStatus, setFilteredData]);

  // Apply filters when search query or year selection changes
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  return (
    <>
      <AppHeader title={'Your Classes'} description={''}>
        {userRole !== 'student' ? (
          <Button 
          onClick={() => setShowCreateClass(true)}
          className="bg-primary-orange-500 hover:bg-primary-orange-600 text-white w-[14rem]"
          >
            <Plus size={16} className="mr-2" />
            Create New Class
          </Button>
        ) : null}
      </AppHeader>
      <div className="p-6 xl:min-w-[900px] space-y-6">

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
              {GRADES.map((grade) => {
                return (
                  <SelectItem key={grade} value={grade}>
                    {grade}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem key={'active'} value={'active'}>
                Active
              </SelectItem>
              <SelectItem key={'canceled'} value={'canceled'}>
                Canceled
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Classes List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
          tutorProfile={tutorProfile}
        />
      </div>
    </>
  );
};

export default TutorClasses;
