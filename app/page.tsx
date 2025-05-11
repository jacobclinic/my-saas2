"use client";

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { UpcomingClassCard } from '@/components/classes/upcoming-class-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ClassForm } from '@/components/classes/class-form';
import { Plus, Users, BookOpen, Calendar, Clock } from 'lucide-react';

export default function Dashboard() {
  const [open, setOpen] = useState(false);

  const upcomingClasses = [
    {
      id: '1',
      title: 'Physics 2026 A/L Group 1',
      subject: 'Physics',
      date: 'Thursday, May 8, 2025',
      time: '2:30 PM - 7:30 PM',
      students: 0
    },
    {
      id: '2',
      title: 'Physics 2027 A/L Group 1',
      subject: 'Physics',
      date: 'Friday, May 9, 2025',
      time: '8:30 PM - 1:30 AM',
      students: 0
    },
    {
      id: '3',
      title: 'Physics 2026 A/L Group 2',
      subject: 'Physics',
      date: 'Saturday, May 10, 2025',
      time: '8:30 PM - 12:30 AM',
      students: 3
    }
  ];

  return (
    <div className="space-y-8">
      <Header title="Tutor Dashboard">
        <Dialog open={open} onOpenChange={setOpen}>
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
            <ClassForm onSuccess={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </Header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-primary-blue-50 to-white border-primary-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-primary-blue-800">Total Students</CardTitle>
            <CardDescription>Across all your classes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="h-8 w-8 text-primary-blue-600 mr-3" />
              <div className="text-3xl font-bold text-primary-blue-900">3</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary-orange-50 to-white border-primary-orange-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-primary-orange-800">Active Classes</CardTitle>
            <CardDescription>Currently running classes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-primary-orange-600 mr-3" />
              <div className="text-3xl font-bold text-primary-orange-900">3</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-blue-800">Next Class</CardTitle>
            <CardDescription>Your upcoming class</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div className="text-sm font-medium text-blue-900">May 8, 2025</div>
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <div className="text-sm font-medium text-blue-900">2:30 PM</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-green-800">Monthly Earnings</CardTitle>
            <CardDescription>Current month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">Rs. 15,000</div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4 text-neutral-800">Upcoming Classes</h2>
        <div className="space-y-4">
          {upcomingClasses.map((classItem) => (
            <UpcomingClassCard
              key={classItem.id}
              id={classItem.id}
              title={classItem.title}
              subject={classItem.subject}
              date={classItem.date}
              time={classItem.time}
              students={classItem.students}
            />
          ))}
        </div>
      </div>
    </div>
  );
}