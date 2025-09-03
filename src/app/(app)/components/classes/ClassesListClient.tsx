'use client';

import { useState, useEffect } from 'react';
import ClassesList from '../../components/classes/ClassesList';
import { ClassType } from '~/lib/classes/types/class-v2';
import PaginationControls from '../PaginationControls';
import UserType from '~/lib/user/types/user';

const ClassesListClient = ({
  classesData,
  userRole,
  tutorId,
  tutorProfile,
}: {
  classesData: ClassType[];
  userRole: string;
  tutorId?: string;
  tutorProfile?: UserType | null;
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [filteredData, setFilteredData] = useState<ClassType[]>(classesData);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Calculate pagination indices
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  // Get the current page's data
  const currentClasses = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  // Reset to page 1 when filtered data changes significantly
  useEffect(() => {
    if (currentPage > Math.ceil(filteredData.length / itemsPerPage) && filteredData.length > 0) {
      setCurrentPage(1);
    }
  }, [filteredData.length, currentPage, itemsPerPage]);

  return (
    <>
      {/* Render the ClassesList component with paginated data */}
      <ClassesList
        classesData={currentClasses}
        userRole={userRole}
        tutorId={tutorId}
        tutorProfile={tutorProfile}
        setFilteredData={setFilteredData}
        allClassesData={classesData}
      />

      {/* Pagination Controls - show when there's at least 1 page of data */}
      {filteredData.length > 1 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </>
  );
};

export default ClassesListClient;