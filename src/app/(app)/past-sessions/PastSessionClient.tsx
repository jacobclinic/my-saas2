// src/components/past-sessions/PastSessionsClient.tsx
'use client';

import { useState } from 'react';
import PastSessions from '../components/past-sessions/PastSessions';
import { PastSession } from '~/lib/sessions/types/session-v2';

const PastSessionsClient = ({
  initialSessions,
}: {
  initialSessions: PastSession[];
}) => {
const [currentPage, setCurrentPage] = useState(1); // Current page number
const [itemsPerPage, setItemsPerPage] = useState(5); // Items per page

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

  // Function to handle page change
  const handlePageChange = (pageNumber: number) => {
    if(pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };

  return (
    <>
      {/* Render the PastSessions component with paginated data */}
      <PastSessions pastSessionsData={currentSessions} />

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6 content-end">
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
            { length: Math.ceil(initialSessions.length / itemsPerPage) },
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
              currentPage === Math.ceil(initialSessions.length / itemsPerPage)
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

export default PastSessionsClient;
