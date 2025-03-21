'use client';

import { useState } from 'react';
import { UpcomingSession } from '~/lib/sessions/types/session-v2';
import UpcomingSessions from './UpcomingSessions';
import PaginationControls from '../PaginationControls';

const UpcomingSessionClient = ({
  upcomingSessionData,
}: {
  upcomingSessionData: UpcomingSession[];
}) => {
  const [currentPage, setCurrentPage] = useState(1); // Current page number
  const itemsPerPage = 5; // Items per page

  // Calculate pagination indices
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  const currentSessions = upcomingSessionData.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );

  const totalPages = Math.ceil(upcomingSessionData.length / itemsPerPage);

  return (
    <>
      {/* Render the PastSessions component with paginated data */}
      <UpcomingSessions upcomingSessionData={currentSessions} />

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={Math.ceil(upcomingSessionData.length / itemsPerPage)}
          onPageChange={setCurrentPage}
        />
      )}
    </>
  );
};

export default UpcomingSessionClient;
