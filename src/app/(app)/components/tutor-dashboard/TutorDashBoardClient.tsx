'use client';

import { useState } from 'react';
import { UpcomingSession } from '~/lib/sessions/types/session';
import UpcomingClassesSection from './tutor-db-sections/UpcomingClasses';
import PaginationControls from '../PaginationControls';
import { Users, BookOpen, Calendar, Clock } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '../base-v2/ui/Card';
import { TutorDashboardData } from '~/lib/tutorStats/types/types';
import {
  convertToLocalTime,
  formatToLocalTime,
} from '~/lib/utils/timezone-utils';

const TutorDBClient = ({
  upcomingSessionDataPerWeek,
  tutorStat,
}: {
  upcomingSessionDataPerWeek: UpcomingSession[];
  tutorStat: TutorDashboardData;
}) => {
  //Pagination controls for ActiveClassesSection
  const [currentPage, setCurrentPage] = useState(1); // Current page number
  const itemsPerPage = 5; // Items per page

  // Calculate the total number of pages
  const totalPages = Math.ceil(
    upcomingSessionDataPerWeek.length / itemsPerPage,
  );

  // // Calculate pagination indices
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  // Get the current page's data
  const currentUpcomingClasses = upcomingSessionDataPerWeek.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );

  // Function to handle page change
  const handlePageChange = (pageNumber: number) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };

  const nextClassTimeLocal = formatToLocalTime(
    tutorStat.nextSession?.start_time ?? null,
  );

  return (
    <div className="space-y-8">
      {/* Render the Upcoming component */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-primary-blue-50 to-white border-primary-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-primary-blue-800">
              Total Students
            </CardTitle>
            <CardDescription>Across all your classes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="h-8 w-8 text-primary-blue-600 mr-3" />
              <div className="text-3xl font-bold text-primary-blue-900">
                {tutorStat.totalStudents}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary-orange-50 to-white border-primary-orange-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-primary-orange-800">
              Active Classes
            </CardTitle>
            <CardDescription>Currently running classes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-primary-orange-600 mr-3" />
              <div className="text-3xl font-bold text-primary-orange-900">
                {tutorStat.activeClasses.length}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-blue-800">
              Next Class
            </CardTitle>
            <CardDescription>Your upcoming class</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div className="text-sm font-medium text-blue-900">
                {tutorStat.nextSession?.start_time
                  ? formatToLocalTime(
                      tutorStat.nextSession.start_time,
                      'MMM d, yyyy',
                    )
                  : 'No upcoming class'}
              </div>
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <div className="text-sm font-medium text-blue-900">
                {nextClassTimeLocal}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-green-800">
              Monthly Earnings
            </CardTitle>
            <CardDescription>Current month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">
              Rs. {tutorStat.monthlyEarnings}
            </div>
          </CardContent>
        </Card>
      </div>
      <UpcomingClassesSection
        upcomingSessionDataPerWeek={currentUpcomingClasses}
      />

      {totalPages > 1 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}

      {/* Render the ActiveClasses component with paginated data */}
      {/* <ActiveClassesSection activeClassesData={currentActiveClasses} /> */}

      {/* <TutorialVideoSection />  */}
    </div>
  );
};

export default TutorDBClient;
