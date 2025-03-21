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
  nextSessionData,
  activeClassesData,
}: {
  nextSessionData: UpcomingSession[];
  activeClassesData: ClassType[];
}) => {

  //Pagination controls for ActiveClassesSection
  const [currentPage, setCurrentPage] = useState(1); // Current page number
  const itemsPerPage = 3; // Items per page

  // Calculate the total number of pages
  const totalPages = Math.ceil(activeClassesData.length / itemsPerPage);

  // Calculate pagination indices
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  // Get the current page's data
  const currentActiveClasses = activeClassesData.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );

  // Function to handle page change
  const handlePageChange2 = (pageNumber: number) => {
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
      <UpcomingClassesSection nextSessionData={nextSessionData} />

      {/* Render the ActiveClasses component with paginated data */}
      <ActiveClassesSection activeClassesData={currentActiveClasses} />

      {/* Pagination Controls 2*/}
      {totalPages > 1 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange2}
        />
      )}

      <TutorialVideoSection />
    </div>
  );
};

export default TutorDBClient;
