'use client';

import { useEffect, useState } from 'react';
import PastSessions from './PastSessions';
import { PastSession } from '~/lib/sessions/types/session-v2';
import PaginationControls from '../PaginationControls';
import { PastSessionData } from '~/lib/sessions/types/past-sessions';

const PastSessionsClient = ({
  initialSessions,
}: {
  initialSessions: PastSession[];
}) => {
  const [currentPage, setCurrentPage] = useState(1); // Current page number
  const itemsPerPage = 5; // Items per page
  const [filteredData, setFilteredData] =
    useState<PastSession[]>(initialSessions);

  // Calculate the total number of pages
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Calculate pagination indices
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  // Get the current page's data
  const currentSessions = filteredData.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );

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
      {/* Render the PastSessions component with paginated data */}
      <PastSessions
        pastSessionsData={currentSessions}
        onFilterChange={handleFilterChange}
        allSessionData={initialSessions}
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

export default PastSessionsClient;
