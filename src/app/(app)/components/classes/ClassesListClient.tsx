'use client';

import { useState } from 'react';

import ClassesList from '../../components/classes/ClassesList';
import { ClassType } from '~/lib/classes/types/class-v2';

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
  const [itemsPerPage, setItemsPerPage] = useState(5); // Items per page

  // Calculate the total number of pages
  const totalPages = Math.ceil(classesData.length / itemsPerPage);

  // Calculate pagination indices
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  // Get the current page's data
  const currentClasses = classesData.slice(indexOfFirstItem, indexOfLastItem);

  // Function to handle page change
  const handlePageChange = (pageNumber: number) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };

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
        <div className="flex justify-center content-end mt-auto mb-5">
          <nav className="flex gap-2">
            {/* Previous Button */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 border rounded-md disabled:opacity-50"
            >
              Previous
            </button>

            {/* Page Numbers */}
            {Array.from(
              { length: Math.ceil(classesData.length / itemsPerPage) },
              (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => handlePageChange(i + 1)}
                  className={`px-4 py-2 border rounded-md ${
                    currentPage === i + 1 ? 'bg-blue-500 text-white' : ''
                  }`}
                >
                  {i + 1}
                </button>
              ),
            )}

            {/* Next Button */}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={
                currentPage === Math.ceil(classesData.length / itemsPerPage)
              }
              className="px-4 py-2 border rounded-md disabled:opacity-50"
            >
              Next
            </button>
          </nav>
        </div>
      )}
    </>
  );
};

export default ClassesListClient;
