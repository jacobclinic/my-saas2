import React from 'react';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5; // Number of pages to show around current page
    const ellipsisThreshold = 8; // Show ellipsis when total pages exceed this

    if (totalPages <= ellipsisThreshold) {
      // Show all pages if total pages is 8 or less
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always show first page
      pageNumbers.push(1);

      // Determine if we need ellipsis at the start
      if (currentPage > maxVisiblePages - 1) {
        pageNumbers.push(-1); // -1 represents ellipsis
      }

      // Calculate range around current page
      let startPage = Math.max(2, currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = Math.min(totalPages - 1, currentPage + Math.floor(maxVisiblePages / 2));

      // Adjust if we're at the beginning or end
      if (currentPage <= maxVisiblePages - 1) {
        endPage = maxVisiblePages + 1;
      } else if (currentPage >= totalPages - Math.floor(maxVisiblePages / 2)) {
        startPage = totalPages - maxVisiblePages;
      }

      // Add page numbers around current page
      for (let i = startPage; i <= endPage; i++) {
        if (i > 1 && i < totalPages) {
          pageNumbers.push(i);
        }
      }

      // Determine if we need ellipsis at the end
      if (currentPage < totalPages - (maxVisiblePages - 2)) {
        pageNumbers.push(-1); // -1 represents ellipsis
      }

      // Always show last page
      pageNumbers.push(totalPages);
    }

    return pageNumbers;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex justify-center mt-4">
      <nav className="flex gap-2 items-center">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 border rounded-md disabled:opacity-50"
        >
          Previous
        </button>
        
        {pageNumbers.map((pageNumber, index) => (
          pageNumber === -1 ? (
            <span key={`ellipsis-${index}`} className="px-2">...</span>
          ) : (
            <button
              key={pageNumber}
              onClick={() => onPageChange(pageNumber)}
              className={`px-4 py-2 border rounded-md ${
                currentPage === pageNumber ? 'bg-blue-500 text-white' : ''
              }`}
            >
              {pageNumber}
            </button>
          )
        ))}
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-4 py-2 border rounded-md disabled:opacity-50"
        >
          Next
        </button>
      </nav>
    </div>
  );
};

export default PaginationControls;