'use client';

import React, { useEffect, useState } from 'react';
import { Info } from 'lucide-react';

import ClassCard from '../../classes/ClassCard';
import {
  ClassListData,
  ClassType,
  NewStudentData,
} from '~/lib/classes/types/class-v2';
import { format as dateFnsFormat } from 'date-fns';

const ActiveClassesSection = ({
  activeClassesData,
}: {
  activeClassesData: ClassType[];
}) => {
  const [activeClassTableData, setActiveClassTableData] = useState<
    ClassListData[]
  >([]);

  useEffect(() => {
    if (activeClassesData) {
      const formattedData = activeClassesData.map((classData) => {
        // Ensure time_slots is an array before reducing
        const schedule =
          classData?.time_slots?.reduce(
            (acc: string, slot: any, index: number, array) => {
              const timeSlotString = `${slot.day}, ${slot.time}`;
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
          nextClass: formattedDate,
          classRawData: classData,
        };
      });
      setActiveClassTableData(formattedData);
    }
  }, [activeClassesData]);

  console.log(
    'nextSessionData and activeClassesData:',
    activeClassesData,
  );

  return (
    <>
      {/* Active Classes */}
      <div className="space-y-4">
        <div className="flex items-center">
          <Info className="h-5 w-5 mr-2" />
          <h2 className="text-xl font-bold">Active Classes</h2>
        </div>
        <div>
          {activeClassTableData.map((classData) => (
            <ClassCard
              key={classData.id}
              classData={classData}
              variant="dashboard"
              showViewDetails={false}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default ActiveClassesSection;
