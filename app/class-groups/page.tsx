"use client";

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClassCard } from '@/components/classes/class-card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ClassForm } from '@/components/classes/class-form';
import { StudentList } from '@/components/classes/student-list';
import { Search, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ClassGroups() {
  const [isCreatingClass, setIsCreatingClass] = useState(false);
  const [showStudents, setShowStudents] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState('All Years');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

  const classes = Array(12).fill(null).map((_, index) => ({
    id: `${index + 1}`,
    title: `Physics ${index % 2 === 0 ? '2026' : '2027'} A/L Group ${Math.floor(index / 2) + 1}`,
    subject: 'Physics',
    date: index % 2 === 0 ? 'Saturday, 15:00 - 19:00' : 'Friday, 15:00 - 20:00',
    time: index % 2 === 0 ? 'Sat, May 10, 2025' : 'Fri, May 09, 2025',
    students: Math.floor(Math.random() * 15),
    year: index % 2 === 0 ? '2026 A/L' : '2027 A/L',
    isActive: Math.random() > 0.3
  }));

  // Mock student data
  const students = [
    {
      id: '1',
      name: 'John Doe',
      phone: '+94 71 234 5678',
      address: '123 Main St, Colombo 05'
    },
    {
      id: '2',
      name: 'Jane Smith',
      phone: '+94 77 345 6789',
      address: '456 Park Ave, Colombo 07'
    },
    {
      id: '3',
      name: 'Alice Johnson',
      phone: '+94 76 456 7890',
      address: '789 Lake View, Rajagiriya'
    }
  ];

  const itemsPerPage = 4; // Changed from 6 to 4 to show 2 cards per row

  const filteredClasses = classes.filter(c => {
    if (searchTerm && !c.title.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    if (yearFilter !== 'All Years' && !c.year.includes(yearFilter)) {
      return false;
    }

    if (statusFilter === 'Active' && !c.isActive) {
      return false;
    }
    if (statusFilter === 'Inactive' && c.isActive) {
      return false;
    }

    return true;
  });

  const totalPages = Math.ceil(filteredClasses.length / itemsPerPage);
  const paginatedClasses = filteredClasses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleViewStudents = (classId: string) => {
    setSelectedClassId(classId);
    setShowStudents(true);
  };

  return (
    <div className="flex flex-col min-h-full animate-fade-in">
      <Header title="Class Groups">
        <Dialog open={isCreatingClass} onOpenChange={setIsCreatingClass}>
          <DialogTrigger asChild>
            <Button className="bg-primary-orange-500 hover:bg-primary-orange-600 text-white">
              <Plus size={16} className="mr-2" />
              Create New Class
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Create Class Group</DialogTitle>
            </DialogHeader>
            <ClassForm />
          </DialogContent>
        </Dialog>
      </Header>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center mt-6">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
          <Input
            placeholder="Search classes..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 flex-col sm:flex-row w-full sm:w-auto">
          <div className="flex items-center gap-2 min-w-[150px]">
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Years">All Years</SelectItem>
                <SelectItem value="2026">2026 A/L</SelectItem>
                <SelectItem value="2027">2027 A/L</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2 min-w-[100px]">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex-grow mt-8">
        {paginatedClasses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {paginatedClasses.map((classItem) => (
              <ClassCard
                key={classItem.id}
                id={classItem.id}
                title={classItem.title}
                subject={classItem.subject}
                date={classItem.date}
                time={classItem.time}
                students={classItem.students}
                isActive={classItem.isActive}
                isUpcoming={false}
                onViewStudents={() => handleViewStudents(classItem.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-neutral-300 rounded-lg bg-neutral-50">
            <p className="text-neutral-600">No classes found matching your filters.</p>
            <Button 
              variant="link" 
              className="mt-2 text-primary-blue-600"
              onClick={() => {
                setSearchTerm('');
                setYearFilter('All Years');
                setStatusFilter('All');
              }}
            >
              Clear all filters
            </Button>
          </div>
        )}
      </div>

      {filteredClasses.length > 0 && (
        <div className="flex justify-center mt-12 mb-6">
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

      <Dialog open={showStudents} onOpenChange={setShowStudents}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>
              {selectedClassId && classes.find(c => c.id === selectedClassId)?.title} - Students
            </DialogTitle>
          </DialogHeader>
          <StudentList students={students} />
        </DialogContent>
      </Dialog>
    </div>
  );
}