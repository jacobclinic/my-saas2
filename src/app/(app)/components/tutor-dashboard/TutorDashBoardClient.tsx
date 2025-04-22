'use client';

import { useState } from 'react';
import { UpcomingSession } from '~/lib/sessions/types/session-v2';
import UpcomingClassesSection from './tutor-db-sections/UpcomingClasses';
import PaginationControls from '../PaginationControls';

const TutorDBClient = ({
  upcomingSessionDataPerWeek
}: {
  upcomingSessionDataPerWeek: UpcomingSession[];
}) => {

  //Pagination controls for ActiveClassesSection
  const [currentPage, setCurrentPage] = useState(1); // Current page number
  const itemsPerPage = 5; // Items per page

  // Calculate the total number of pages
  const totalPages = Math.ceil(upcomingSessionDataPerWeek.length / itemsPerPage);

  // // Calculate pagination indices
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  // Get the current page's data
  const currentUpcomingClasses = upcomingSessionDataPerWeek.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );

  // Function to handle page change
  const handlePageChange = (pageNumber: number) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Render the Upcoming component */}
      <UpcomingClassesSection upcomingSessionDataPerWeek={currentUpcomingClasses} />

      {totalPages > 1 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}

      {/* Render the ActiveClasses component with paginated data */}
      {/* <ActiveClassesSection activeClassesData={currentActiveClasses} /> */}


      {/* <TutorialVideoSection />  */}
    </div>
  );
};

export default TutorDBClient;
