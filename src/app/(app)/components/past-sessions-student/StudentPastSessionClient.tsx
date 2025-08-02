'use client';

import { useState, useEffect } from 'react';
import { PastSession } from '~/lib/sessions/types/session';
import PaginationControls from '../PaginationControls';
import StudentPastSessions from './StudentPastSessions';

const StudentPastSessionClient = ({
  pastSessionData,
  userId,
}: {
  pastSessionData: PastSession[];
  userId: string;
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [filteredData, setFilteredData] =
    useState<PastSession[]>(pastSessionData);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Calculate current page data
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSessions = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  // Handler for when filters are applied in the child component
  const handleFilterChange = (newFilteredData: PastSession[]) => {
    setFilteredData(newFilteredData);

    // Reset to first page when filters change
    if (
      currentPage > Math.ceil(newFilteredData.length / itemsPerPage) &&
      newFilteredData.length > 0
    ) {
      setCurrentPage(1);
    }
  };

  // Reset to page 1 when filtered data changes
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [filteredData, totalPages, currentPage]);

  return (
    <>
      {/* Render the UpcomingSessions component */}
      <StudentPastSessions
        pastSessionData={currentSessions}
        onFilterChange={handleFilterChange}
        allSessionData={pastSessionData}
        userId={userId}
      />

      {/* Pagination Controls - show even when there's only 1 page, for consistency */}
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

export default StudentPastSessionClient;
