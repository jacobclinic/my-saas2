'use client';

import { useState } from 'react';

import ClassesList from '../../components/classes/ClassesList';
import { ClassType } from '~/lib/classes/types/class-v2';
import PaginationControls from '../PaginationControls';

const ClassesListClient = ({
  classesData,
  userRole,
  tutorId,
}: {
  classesData: ClassType[];
  userRole: string;
  tutorId?: string;
}) => {
  const [currentPage, setCurrentPage] = useState(1); // Current page number
  const itemsPerPage = 5; // Items per page

  // Calculate the total number of pages
  const totalPages = Math.ceil(classesData.length / itemsPerPage);

  // Calculate pagination indices
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  // Get the current page's data
  const currentClasses = classesData.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <>
      {/* Render the PastSessions component with paginated data */}
      <ClassesList
        classesData={currentClasses}
        userRole={userRole}
        tutorId={tutorId}
      />

      {/* Pagination Controls */}
      {totalPages > 1 && (
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
