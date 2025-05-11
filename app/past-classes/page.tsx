"use client";

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PastClassCard } from '@/components/classes/past-class-card';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { DateRangePicker } from '@/components/classes/date-range-picker';

export default function PastClassesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });

  const pastClasses = Array(10).fill(null).map((_, index) => ({
    id: `${index + 1}`,
    title: `Physics 2026 A/L Group ${index + 1}`,
    subject: 'Physics',
    date: 'May 1, 2025',
    time: '2:30 PM - 7:30 PM',
    students: Math.floor(Math.random() * 15) + 5,
    hasMaterials: Math.random() > 0.5,
    hasRecording: Math.random() > 0.5,
    attendance: Math.floor(Math.random() * 10) + 5
  }));

  const itemsPerPage = 5;
  const totalPages = Math.ceil(pastClasses.length / itemsPerPage);

  const filteredClasses = pastClasses.filter(c => {
    if (searchTerm && !c.title.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  const paginatedClasses = filteredClasses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Past Classes" />

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
          <Input
            placeholder="Search by class name..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="w-full md:w-[300px]">
          <DateRangePicker onDateRangeChange={setDateRange} />
        </div>
      </div>

      <div className="space-y-4">
        {paginatedClasses.map((classItem) => (
          <PastClassCard
            key={classItem.id}
            id={classItem.id}
            title={classItem.title}
            subject={classItem.subject}
            date={classItem.date}
            time={classItem.time}
            students={classItem.students}
            hasMaterials={classItem.hasMaterials}
            hasRecording={classItem.hasRecording}
            attendance={classItem.attendance}
          />
        ))}

        {paginatedClasses.length === 0 && (
          <div className="text-center py-12 border border-dashed border-neutral-300 rounded-lg bg-neutral-50">
            <p className="text-neutral-600">No classes found matching your search.</p>
            <Button 
              variant="link" 
              className="mt-2 text-primary-blue-600"
              onClick={() => {
                setSearchTerm('');
                setCurrentPage(1);
              }}
            >
              Clear filters
            </Button>
          </div>
        )}
      </div>

      {filteredClasses.length > 0 && (
        <div className="flex justify-center mt-8">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              className="px-4 py-2 h-10"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} className="mr-1" />
              Previous
            </Button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button 
                key={page}
                variant="outline" 
                className={`px-4 py-2 h-10 ${
                  currentPage === page 
                    ? 'bg-primary-blue-500 text-white border-primary-blue-500 hover:bg-primary-blue-600'
                    : ''
                }`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
            
            <Button 
              variant="outline" 
              className="px-4 py-2 h-10"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight size={16} className="ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}