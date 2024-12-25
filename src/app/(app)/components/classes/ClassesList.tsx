'use client'

import React, { useState } from 'react';
import { Button } from "../base-v2/ui/Button";
import { Input } from "../base-v2/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../base-v2/ui/Select";
import {
  Plus,
  Search,
} from 'lucide-react';
import { NewStudentData, NewClassData, LinkCopiedState, ClassListData } from '~/lib/classes/types/class-v2';
import ClassCard from './ClassCard';
import CreateClassDialog from './CreateClassDialog';

const TutorClasses = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('all');
  const [linkCopied, setLinkCopied] = useState<LinkCopiedState>({});
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [createClassLoading, setCreateClassLoading] = useState(false);

  // Sample class data with Sri Lankan context
  const classes: ClassListData[] = [
    {
      id: 1,
      name: "2025 A/L Accounting - Batch 1",
      schedule: "Every Monday and Wednesday, 4:00 PM",
      status: "Active",
      students: 25,
      academicYear: "2024/2025",
      registrationLink: "https://commaeducation.com/classes/123/register",
      nextClass: "Mon, Dec 18, 2024"
    },
    {
      id: 2,
      name: "2024 A/L Accounting Revision - Batch 2",
      schedule: "Every Tuesday and Thursday, 2:00 PM",
      status: "Active",
      students: 18,
      academicYear: "2023/2024",
      registrationLink: "https://commaeducation.com/classes/456/register",
      nextClass: "Tue, Dec 19, 2024"
    }
  ];

  const handleCreateClass = async (classData: NewClassData) => {
    try {
      setCreateClassLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Creating new class:', classData);
      setShowCreateClass(false);
      // Add success notification here if needed
    } catch (error) {
      console.error('Error creating class:', error);
      // Add error notification here if needed
    } finally {
      setCreateClassLoading(false);
    }
  };

  const handleCopyLink = (classId: number, link: string): void => {
    navigator.clipboard.writeText(link);
    setLinkCopied({ ...linkCopied, [classId]: true });
    setTimeout(() => {
      setLinkCopied({ ...linkCopied, [classId]: false });
    }, 2000);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Your Classes</h1>
        <Button onClick={() => setShowCreateClass(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Class
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search classes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            <SelectItem value="2024/2025">2024/2025</SelectItem>
            <SelectItem value="2023/2024">2023/2024</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Classes List */}
      <div>
        {classes
          .filter(cls => {
            if (searchQuery) {
              return cls.name.toLowerCase().includes(searchQuery.toLowerCase());
            }
            if (selectedYear !== 'all') {
              return cls.academicYear === selectedYear;
            }
            return true;
          })
          .map(classData => (
            <ClassCard 
              key={classData.id} 
              classData={classData}
              linkCopied={linkCopied}
              onCopyLink={handleCopyLink}
            />
          ))
        }
      </div>

      {/* Dialogs */}
      <CreateClassDialog
        open={showCreateClass}
        onClose={() => setShowCreateClass(false)}
        onCreateClass={handleCreateClass}
        loading={createClassLoading}
      />
    </div>
  );
};

export default TutorClasses;