import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Download, Phone, MapPin } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  phone: string;
  address: string;
}

interface StudentListProps {
  students: Student[];
}

export function StudentList({ students }: StudentListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.phone.includes(searchTerm)
  );

  const exportToCSV = () => {
    const headers = ['Name', 'Phone', 'Address'];
    const csvContent = [
      headers.join(','),
      ...filteredStudents.map(student => 
        [student.name, student.phone, student.address].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'students.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative flex-grow max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
          <Input
            placeholder="Search students..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button
          onClick={exportToCSV}
          className="bg-primary-blue-600 hover:bg-primary-blue-700 text-white"
        >
          <Download size={16} className="mr-2" />
          Export List
        </Button>
      </div>

      <ScrollArea className="h-[400px] rounded-md border">
        <div className="space-y-2 p-4">
          {filteredStudents.map((student) => (
            <div
              key={student.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-neutral-50 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3 mb-2 sm:mb-0">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-blue-100 text-primary-blue-600 font-medium">
                  {student.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-medium text-neutral-900">{student.name}</h3>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 text-sm text-neutral-600">
                <div className="flex items-center gap-2">
                  <Phone size={16} className="text-neutral-400" />
                  {student.phone}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-neutral-400" />
                  {student.address}
                </div>
              </div>
            </div>
          ))}

          {filteredStudents.length === 0 && (
            <div className="text-center py-8 text-neutral-500">
              <p>No students found matching your search.</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}