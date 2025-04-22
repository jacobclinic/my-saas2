'use client';

import { useState, useEffect } from 'react';
import { UpcomingSession } from '~/lib/sessions/types/session-v2';
import AdminDashboardSessions from './AdminDashboardSessions';
import PaginationControls from '../../PaginationControls';

const AdminDashboardClient = ({
  upcomingSessionData,
}: {
  upcomingSessionData: UpcomingSession[];
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [filteredData, setFilteredData] = useState<UpcomingSession[]>(upcomingSessionData);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Calculate current page data
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSessions = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  // Handler for when filters are applied in the child component
  const handleFilterChange = (newFilteredData: UpcomingSession[]) => {
    setFilteredData(newFilteredData);
    
    // Reset to first page when filters change
    if (currentPage > Math.ceil(newFilteredData.length / itemsPerPage) && newFilteredData.length > 0) {
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
      {/* Render the AdminDashboardSessions component */}
      <AdminDashboardSessions 
        upcomingSessionData={currentSessions} 
        onFilterChange={handleFilterChange}
        allSessionData={upcomingSessionData}
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

export default AdminDashboardClient;