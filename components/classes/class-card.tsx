"use client";

import { useState } from 'react';
import { BookOpen, Calendar, Users, UserPlus, Edit, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StudentInvitationForm } from './student-invitation-form';
import { toast } from '@/hooks/use-toast';

interface ClassCardProps {
  id: string;
  title: string;
  subject: string;
  date: string;
  time: string;
  students: number;
  isActive?: boolean;
  isUpcoming?: boolean;
  onViewStudents?: (id: string) => void;
}

export function ClassCard({ 
  id, 
  title, 
  subject, 
  date, 
  time, 
  students, 
  isActive = true,
  isUpcoming = true,
  onViewStudents
}: ClassCardProps) {
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setEditLoading(false);
      setShowEditForm(false);
    }, 1000);
  };

  const handleCopyLink = async () => {
    // In a real application, this would be a proper registration link
    const registrationLink = `https://your-domain.com/register/${id}`;
    
    try {
      await navigator.clipboard.writeText(registrationLink);
      setIsCopied(true);
      toast({
        title: "Link copied!",
        description: "Registration link has been copied to clipboard.",
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again.",
        variant: "destructive",
      });
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
                  {title}
                </CardTitle>
                <Badge variant="outline" className="mt-1 bg-primary-blue-50 text-primary-blue-700 border-primary-blue-200">
                  {subject}
                </Badge>
              </div>
            </div>
            {isActive && (
              <Badge variant="default" className="bg-success text-white">
                active
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-4 pb-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50">
              <Calendar size={18} className="text-primary-blue-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-neutral-900">{date}</p>
                <p className="text-xs text-neutral-600">Schedule</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50">
              <Users size={18} className="text-primary-blue-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-neutral-900">{students} Students</p>
                <p className="text-xs text-neutral-600">Enrolled</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-primary-blue-700 hover:text-primary-blue-800 hover:bg-primary-blue-50"
              onClick={() => setShowInviteForm(true)}
            >
              <UserPlus size={16} className="mr-2" />
              Add Student
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className={`text-primary-blue-700 hover:text-primary-blue-800 hover:bg-primary-blue-50 ${isCopied ? 'bg-primary-blue-50' : ''}`}
              onClick={handleCopyLink}
            >
              {isCopied ? (
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
            onClick={() => setShowEditForm(true)}
          >
            <Edit size={16} className="mr-2" />
            Edit Class
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="border-primary-blue-200 text-primary-blue-700 hover:bg-primary-blue-50 group-hover:bg-primary-blue-50"
            onClick={() => onViewStudents && onViewStudents(id)}
          >
            View Students
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={showInviteForm} onOpenChange={setShowInviteForm}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Invite Student to {title}</DialogTitle>
          </DialogHeader>
          <StudentInvitationForm onClose={() => setShowInviteForm(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Class Details</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="class-name">Class Name</Label>
                <Input 
                  id="class-name" 
                  defaultValue={title}
                  className="focus-visible:ring-primary-blue-500" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Select defaultValue={subject.toLowerCase()}>
                    <SelectTrigger id="subject" className="focus-visible:ring-primary-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="physics">Physics</SelectItem>
                      <SelectItem value="chemistry">Chemistry</SelectItem>
                      <SelectItem value="biology">Biology</SelectItem>
                      <SelectItem value="mathematics">Mathematics</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="year-grade">Year/Grade</Label>
                  <Select defaultValue="2026">
                    <SelectTrigger id="year-grade" className="focus-visible:ring-primary-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2026">2026 A/L</SelectItem>
                      <SelectItem value="2027">2027 A/L</SelectItem>
                      <SelectItem value="2028">2028 A/L</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="day">Day of Week</Label>
                <Select defaultValue="saturday">
                  <SelectTrigger id="day" className="focus-visible:ring-primary-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monday">Monday</SelectItem>
                    <SelectItem value="tuesday">Tuesday</SelectItem>
                    <SelectItem value="wednesday">Wednesday</SelectItem>
                    <SelectItem value="thursday">Thursday</SelectItem>
                    <SelectItem value="friday">Friday</SelectItem>
                    <SelectItem value="saturday">Saturday</SelectItem>
                    <SelectItem value="sunday">Sunday</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="start-time">Start Time</Label>
                  <Input
                    id="start-time"
                    type="time"
                    defaultValue="15:00"
                    className="focus-visible:ring-primary-blue-500"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="end-time">End Time</Label>
                  <Input
                    id="end-time"
                    type="time"
                    defaultValue="19:00"
                    className="focus-visible:ring-primary-blue-500"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="fee">Monthly Fee (Rs.)</Label>
                <Input 
                  id="fee" 
                  type="number" 
                  defaultValue="5000"
                  className="focus-visible:ring-primary-blue-500" 
                />
              </div>
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                type="button"
                onClick={() => setShowEditForm(false)}
                className="border-neutral-200"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={editLoading}
                className="bg-primary-blue-600 hover:bg-primary-blue-700 text-white min-w-[100px]"
              >
                {editLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}