'use client';

import { useState } from 'react';
import PastSessions from './PastSessions';
import { PastSession } from '~/lib/sessions/types/session-v2';
import PaginationControls from '../PaginationControls';

const PastSessionsClient = ({
  initialSessions,
}: {
  initialSessions: PastSession[];
}) => {
  const [currentPage, setCurrentPage] = useState(1); // Current page number
  const itemsPerPage = 5; // Items per page

  // Calculate the total number of pages
  const totalPages = Math.ceil(initialSessions.length / itemsPerPage);

  // Calculate pagination indices
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  // Get the current page's data
  const currentSessions = initialSessions.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );

  return (
    <>
      {/* Render the PastSessions component with paginated data */}
      <PastSessions pastSessionsData={currentSessions} />

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
