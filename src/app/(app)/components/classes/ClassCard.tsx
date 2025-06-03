'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../base-v2/ui/Card';
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
  BookOpen,
  UserPlus,
  Edit,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  ClassCardProps,
  EditClassData,
  NewStudentData,
} from '~/lib/classes/types/class-v2';
import RegisteredStudentsDialog from './RegisteredStudentsDialog';
import EditClassDialog from './EditClassDialog';
import AddStudentDialog from './AddStudentDialog';
import { generateRegistrationLinkAction } from '~/app/actions/registration-link';

const ClassCard: React.FC<ClassCardProps> = ({
  classData,
  variant = 'default',
  showViewDetails = true,
}) => {
  const isDashboard = variant === 'dashboard';
  const [showStudentsDialog, setShowStudentsDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [showAddStudentDialog, setShowAddStudentDialog] = useState(false);
  const [addStudentLoading, setAddStudentLoading] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const handleCopyLink = async () => {
    const classId = classData.id;
    const registrationData = {
      classId,
      className: classData.name || '',
      nextSession: classData.nextClass || classData.schedule || '',
      time: classData.schedule || '',
    };

    const registrationLink =
      await generateRegistrationLinkAction(registrationData);

    navigator.clipboard.writeText(registrationLink);
    setLinkCopied(true);
    setTimeout(() => {
      setLinkCopied(false);
    }, 2000);
  };

  const handleUpdateClass = async (
    classId: string,
    updatedData: EditClassData,
  ) => {
    try {
      setEditLoading(true);
      // Here you would make your API call to update the class
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
      // console.log('Updating class:', classId, updatedData);

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
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // console.log('Adding student:', studentData, 'to class:', classData.id);
      setShowAddStudentDialog(false);
    } catch (error) {
      console.error('Error adding student:', error);
    } finally {
      setAddStudentLoading(false);
    }
  };

  return (
    <>
      <Card className="group bg-white border-neutral-200 shadow-sm hover:shadow-md transition-all duration-300 h-full">
        <CardHeader className="pb-3 border-b border-neutral-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-blue-50 text-primary-blue-600">
                <BookOpen size={20} />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-neutral-900">
                  {classData.name}
                </CardTitle>
                {classData.classRawData ? (
                  <Badge
                    variant="outline"
                    className="mt-1 bg-primary-blue-50 text-primary-blue-700 border-primary-blue-200"
                  >
                    {classData.classRawData.subject}
                  </Badge>
                ) : null}
                {'grade' in classData && (
                  <Badge
                    variant="secondary"
                    className="mt-1 ml-1 bg-primary-blue-50 text-primary-blue-700 border-primary-blue-200"
                  >
                    {classData.grade}
                  </Badge>
                )}
              </div>
            </div>
            {classData.status === 'active' ? (
              <Badge variant="outline" className="bg-success text-white">
                Active
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-danger text-white">
                Canceled
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-4 pb-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50">
              <div>
                <div className="flex items-center text-sm text-gray-600">
                  <CalendarDays className="h-4 w-4 mr-2 text-primary-blue-600" />

                  {classData.schedule?.replace(/\b([a-z])/, (match) =>
                    match.toUpperCase(),
                  )}
                </div>
                {'nextClass' in classData && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2 text-primary-blue-600" />
                    Next class: {classData.nextClass}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50">
              <Users
                size={18}
                className="text-primary-blue-600 flex-shrink-0"
              />
              <div>
                <p className="text-sm font-medium text-neutral-900">
                  {classData.students} Students
                </p>
                <p className="text-xs text-neutral-600">Enrolled</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-primary-blue-700 hover:text-primary-blue-800 hover:bg-primary-blue-50"
              onClick={() => setShowAddStudentDialog(true)}
              disabled={classData.status === 'canceled'}
            >
              <UserPlus size={16} className="mr-2" />
              Add Student
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className={`text-primary-blue-700 hover:text-primary-blue-800 hover:bg-primary-blue-50 ${linkCopied ? 'bg-primary-blue-50' : ''}`}
              onClick={handleCopyLink}
              disabled={classData.status === 'canceled'}
            >
              {linkCopied ? (
                <>
                  <Check size={16} className="mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy size={16} className="mr-2" />
                  Copy Link
                </>
              )}
            </Button>
          </div>
        </CardContent>

        <CardFooter className="pt-3 grid grid-cols-2 gap-2 border-t border-neutral-100">
          <Button
            variant="outline"
            size="sm"
            className="border-primary-blue-200 text-primary-blue-700 hover:bg-primary-blue-50 group-hover:bg-primary-blue-50"
            onClick={() => setShowEditDialog(true)}
            disabled={classData.status === 'canceled'}
          >
            <Edit size={16} className="mr-2" />
            Edit Class
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-primary-blue-200 text-primary-blue-700 hover:bg-primary-blue-50 group-hover:bg-primary-blue-50"
            onClick={() => setShowStudentsDialog(true)}
          >
            View Students
          </Button>
        </CardFooter>
      </Card>

      <RegisteredStudentsDialog
        open={showStudentsDialog}
        onClose={() => setShowStudentsDialog(false)}
        classDataName={classData?.name}
        studentData={classData?.classRawData?.students || []}
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
