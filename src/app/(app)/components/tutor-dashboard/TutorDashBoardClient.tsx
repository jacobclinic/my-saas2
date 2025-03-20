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
  //Pagination controls for UpcomingClassesSection
  const [currentPage1, setCurrentPage1] = useState(1); // Current page number
  const itemsPerPage1 = 5; // Items per page

  // Calculate the total number of pages
  const totalPages1 = Math.ceil(nextSessionData.length / itemsPerPage1);

  // Calculate pagination indices
  const indexOfLastItem1 = currentPage1 * itemsPerPage1;
  const indexOfFirstItem1 = indexOfLastItem1 - itemsPerPage1;

  // Get the current page's data
  const currentUpcomingClasses = nextSessionData.slice(
    indexOfFirstItem1,
    indexOfLastItem1,
  );

  // Function to handle page change
  const handlePageChange1 = (pageNumber: number) => {
    if (pageNumber < 1 || pageNumber > totalPages1) return;
    setCurrentPage1(pageNumber);
  };

  //Pagination controls for ActiveClassesSection
  const [currentPage2, setCurrentPage2] = useState(1); // Current page number
  const [itemsPerPage2, setItemsPerPage2] = useState(3); // Items per page

  // Calculate the total number of pages
  const totalPages2 = Math.ceil(activeClassesData.length / itemsPerPage2);

  // Calculate pagination indices
  const indexOfLastItem2 = currentPage2 * itemsPerPage2;
  const indexOfFirstItem2 = indexOfLastItem2 - itemsPerPage2;

  // Get the current page's data
  const currentActiveClasses = activeClassesData.slice(
    indexOfFirstItem2,
    indexOfLastItem2,
  );

  // Function to handle page change
  const handlePageChange2 = (pageNumber: number) => {
    if (pageNumber < 1 || pageNumber > totalPages2) return;
    setCurrentPage2(pageNumber);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <Alert className="bg-blue-50 border-blue-200" type={undefined}>
        <AlertDescription className="text-blue-700">
          Quick tip: Upload class materials before the session starts to ensure
          students are prepared.
        </AlertDescription>
      </Alert>
      {/* Render the PastSessions component with paginated data */}
      <UpcomingClassesSection nextSessionData={currentUpcomingClasses} />

      {/* Pagination Controls 1*/}
      {totalPages1 > 1 && (
        <PaginationControls
          currentPage={currentPage1}
          totalPages={totalPages1}
          onPageChange={handlePageChange1}
        />
      )}

      {/* Render the ActiveClasses component with paginated data */}
      <ActiveClassesSection activeClassesData={currentActiveClasses} />

      {/* Pagination Controls 2*/}
      {totalPages2 > 1 && (
        <PaginationControls
          currentPage={currentPage2}
          totalPages={totalPages2}
          onPageChange={handlePageChange2}
        />
      )}

      <TutorialVideoSection />
    </div>
  );
};

export default TutorDBClient;
