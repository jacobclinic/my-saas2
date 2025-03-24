'use client';

import { useState } from 'react';
import { ClassType } from '~/lib/classes/types/class-v2';
import { UpcomingSession } from '~/lib/sessions/types/session-v2';
import TutorDashboard from './TutorDashboard';
import { Info } from 'lucide-react';
import Alert from '~/core/ui/Alert';
import { AlertDescription } from '../base-v2/ui/Alert';
import UpcomingClassesSection from './tutor-db-sections/UpcomingClasses';
import ActiveClassesSection from './tutor-db-sections/ActiveClasses';
import TutorialVideoSection from './tutor-db-sections/TutorialVideoSection';
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
      <Alert className="bg-blue-50 border-blue-200" type={undefined}>
        <AlertDescription className="text-blue-700">
          Quick tip: Upload class materials before the session starts to ensure
          students are prepared.
        </AlertDescription>
      </Alert>
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
