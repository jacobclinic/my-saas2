'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '../base-v2/ui/Card';
import { Button } from '../base-v2/ui/Button';
import { Badge } from '../base-v2/ui/Badge';
import {
  Plus,
  Users,
  Copy,
  Check,
  Edit2,
  CalendarDays,
  ChevronRight,
  Calendar,
  Building,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { ClassCardProps, EditClassData, NewStudentData } from '~/lib/classes/types/class-v2';
import RegisteredStudentsDialog from './RegisteredStudentsDialog';
import EditClassDialog from './EditClassDialog';
import AddStudentDialog from './AddStudentDialog';

const ClassCard: React.FC<ClassCardProps> = ({
  classData,
  linkCopied,
  onCopyLink,
  variant = 'default',
  showViewDetails = true,
}) => {
  const isDashboard = variant === 'dashboard';
  const [showStudentsDialog, setShowStudentsDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [showAddStudentDialog, setShowAddStudentDialog] = useState(false);
  const [addStudentLoading, setAddStudentLoading] = useState(false);

  const handleUpdateClass = async (classId: number, updatedData: EditClassData) => {
    try {
      setEditLoading(true);
      // Here you would make your API call to update the class
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      console.log('Updating class:', classId, updatedData);
      
      // Close dialog and show success message
      setShowEditDialog(false);
      // You might want to trigger a refresh of the class list or update local state
      
    } catch (error) {
      console.error('Error updating class:', error);
      // Handle error (show error message, etc.)
    } finally {
      setEditLoading(false);
    }
  };

  const handleAddStudent = async (studentData: NewStudentData) => {
    try {
      setAddStudentLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Adding student:', studentData, 'to class:', classData.id);
      setShowAddStudentDialog(false);
    } catch (error) {
      console.error('Error adding student:', error);
    } finally {
      setAddStudentLoading(false);
    }
  };

  return (
    <>
      <Card className={cn('mb-4', isDashboard && 'border-blue-200 bg-blue-50')}>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold">{classData.name}</h3>
                  <div className="flex items-center text-sm text-gray-600">
                    <CalendarDays className="h-4 w-4 mr-2" />
                    {classData.schedule}
                  </div>
                  {'nextClass' in classData && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      Next class: {classData.nextClass}
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">{classData.students} Students</Badge>
                  {'academicYear' in classData && (
                    <Badge variant="secondary">{classData.academicYear}</Badge>
                  )}
                </div>
              </div>

              <div className="space-x-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    onCopyLink(classData.id, classData.registrationLink)
                  }
                >
                  {linkCopied[classData.id] ? (
                    <Check className="h-4 w-4 mr-2" />
                  ) : (
                    <Copy className="h-4 w-4 mr-2" />
                  )}
                  {linkCopied[classData.id] ? 'Copied!' : 'Registration Link'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAddStudentDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Student
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => setShowStudentsDialog(true)}
              >
                <Users className="h-4 w-4 mr-2" />
                View Students
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowEditDialog(true)}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Class
              </Button>

              {showViewDetails && (
                <Button
                  variant="outline"
                  onClick={() =>
                    (window.location.href = `/classes/${classData.id}`)
                  }
                >
                  <ChevronRight className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <RegisteredStudentsDialog
        open={showStudentsDialog}
        onClose={() => setShowStudentsDialog(false)}
        classData={{
          id: classData.id,
          name: classData.name,
        }}
      />
      <EditClassDialog
        open={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        onUpdateClass={handleUpdateClass}
        classData={classData}
        loading={editLoading}
      />
      <AddStudentDialog
        open={showAddStudentDialog}
        onClose={() => setShowAddStudentDialog(false)}
        classData={classData}
        onAddStudent={handleAddStudent}
        loading={addStudentLoading}
      />
    </>
  );
};

export default ClassCard;