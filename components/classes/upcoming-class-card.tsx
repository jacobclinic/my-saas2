"use client";

import { useState } from 'react';
import { Calendar, Clock, Users, PlusCircle, ExternalLink, Copy, FileText, Edit, Upload as UploadIcon, Trash2, Loader2, BookOpen, ListChecks, BookMarked } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'complete' | 'error';
}

interface Material {
  id: string;
  name: string;
  size: string;
}

interface UpcomingClassCardProps {
  id: string;
  title: string;
  subject: string;
  date: string;
  time: string;
  students: number;
  hasMaterials?: boolean;
}

interface LessonDetails {
  topic: string;
  objectives: string;
  homework: string;
}

export function UpcomingClassCard({ 
  id, 
  title, 
  subject, 
  date, 
  time, 
  students,
  hasMaterials = false
}: UpcomingClassCardProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [showMaterials, setShowMaterials] = useState(false);
  const [showLessonDetails, setShowLessonDetails] = useState(false);
  const [showEditClass, setShowEditClass] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [lessonDetails, setLessonDetails] = useState<LessonDetails>({
    topic: '',
    objectives: '',
    homework: ''
  });
  const [hasLessonDetails, setHasLessonDetails] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  const handleCopyLink = () => {
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const [materials, setMaterials] = useState<Material[]>(
    hasMaterials ? [
      { id: '1', name: 'Lecture Notes.pdf', size: '2.4 MB' },
      { id: '2', name: 'Practice Questions.pdf', size: '1.1 MB' },
      { id: '3', name: 'Tutorial Slides.pptx', size: '3.7 MB' }
    ] : []
  );

  const handleFileUpload = (files: FileList) => {
    const newFiles = Array.from(files).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      progress: 0,
      status: 'uploading' as const
    }));

    setUploadingFiles(prev => [...prev, ...newFiles]);

    newFiles.forEach(uploadFile => {
      const interval = setInterval(() => {
        setUploadingFiles(prev => {
          const fileIndex = prev.findIndex(f => f.id === uploadFile.id);
          if (fileIndex === -1) return prev;

          const file = prev[fileIndex];
          if (file.progress >= 100) {
            clearInterval(interval);
            
            setMaterials(prevMaterials => [...prevMaterials, {
              id: uploadFile.id,
              name: uploadFile.file.name,
              size: `${(uploadFile.file.size / (1024 * 1024)).toFixed(1)} MB`
            }]);

            return prev.filter(f => f.id !== uploadFile.id);
          }

          const newFiles = [...prev];
          newFiles[fileIndex] = {
            ...file,
            progress: file.progress + 10
          };
          return newFiles;
        });
      }, 300);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  const handleDelete = (materialId: string) => {
    setMaterials(prev => prev.filter(m => m.id !== materialId));
  };

  const handleSaveLessonDetails = () => {
    setHasLessonDetails(true);
    setShowLessonDetails(false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setEditLoading(false);
      setShowEditClass(false);
    }, 1000);
  };

  return (
    <>
      <Card className="group bg-white border-neutral-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
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
          </div>
        </CardHeader>
        
        <CardContent className="pt-4 pb-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50">
              <Calendar size={18} className="text-primary-blue-600" />
              <div>
                <p className="text-sm font-medium text-neutral-900">{date}</p>
                <p className="text-xs text-neutral-600">Date</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50">
              <Clock size={18} className="text-primary-blue-600" />
              <div>
                <p className="text-sm font-medium text-neutral-900">{time}</p>
                <p className="text-xs text-neutral-600">Time</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50">
              <Users size={18} className="text-primary-blue-600" />
              <div>
                <p className="text-sm font-medium text-neutral-900">{students} Students</p>
                <p className="text-xs text-neutral-600">Enrolled</p>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className={`pl-0 text-primary-blue-700 hover:text-primary-blue-800 hover:bg-primary-blue-50 ${
                hasLessonDetails ? 'bg-primary-blue-50' : ''
              }`}
              onClick={() => setShowLessonDetails(true)}
            >
              <PlusCircle size={16} className="mr-2" />
              {hasLessonDetails ? 'View Lesson Details' : 'Add Lesson Details'}
            </Button>
          </div>
        </CardContent>
        
        <CardFooter className="pt-3 grid grid-cols-2 md:grid-cols-4 gap-2 border-t border-neutral-100">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="w-full bg-primary-blue-50 text-primary-blue-700 hover:bg-primary-blue-100 border border-primary-blue-100 group-hover:bg-primary-blue-100"
                >
                  <ExternalLink size={16} className="mr-2" />
                  <span>Join Class</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Join the class as a tutor</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="w-full text-neutral-700 hover:bg-neutral-100 border border-neutral-200"
                  onClick={handleCopyLink}
                >
                  <Copy size={16} className="mr-2" />
                  <span>{isCopied ? 'Copied!' : 'Copy Link'}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy student link to clipboard</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  className={`w-full text-neutral-700 hover:bg-neutral-100 border border-neutral-200 ${materials.length > 0 ? 'bg-primary-blue-50 border-primary-blue-100' : ''}`}
                  onClick={() => setShowMaterials(true)}
                >
                  <FileText size={16} className="mr-2" />
                  <span>Materials {materials.length > 0 && `(${materials.length})`}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Manage class materials</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="w-full text-neutral-700 hover:bg-neutral-100 border border-neutral-200"
                  onClick={() => setShowEditClass(true)}
                >
                  <Edit size={16} className="mr-2" />
                  <span>Edit</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit class schedule</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardFooter>
      </Card>

      <Dialog open={showEditClass} onOpenChange={setShowEditClass}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Class Schedule</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleEditSubmit} className="space-y-6">
            <div className="space-y-4">
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
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <Clock size={16} className="text-neutral-500" />
                    </div>
                    <Input
                      id="start-time"
                      type="time"
                      defaultValue="15:00"
                      className="pl-10 focus-visible:ring-primary-blue-500"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="end-time">End Time</Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <Clock size={16} className="text-neutral-500" />
                    </div>
                    <Input
                      id="end-time"
                      type="time"
                      defaultValue="19:00"
                      className="pl-10 focus-visible:ring-primary-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                type="button"
                onClick={() => setShowEditClass(false)}
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

      <Dialog open={showLessonDetails} onOpenChange={setShowLessonDetails}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Lesson Details</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="topic" className="flex items-center gap-2">
                  <BookOpen size={16} className="text-primary-blue-600" />
                  Topic
                </Label>
                <Input
                  id="topic"
                  value={lessonDetails.topic}
                  onChange={(e) => setLessonDetails(prev => ({ ...prev, topic: e.target.value }))}
                  placeholder="Enter the main topic for this lesson"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="objectives" className="flex items-center gap-2">
                  <ListChecks size={16} className="text-primary-blue-600" />
                  Learning Objectives
                </Label>
                <Textarea
                  id="objectives"
                  value={lessonDetails.objectives}
                  onChange={(e) => setLessonDetails(prev => ({ ...prev, objectives: e.target.value }))}
                  placeholder="List the key learning objectives (one per line)"
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="homework" className="flex items-center gap-2">
                  <BookMarked size={16} className="text-primary-blue-600" />
                  Homework/Assignment
                </Label>
                <Textarea
                  id="homework"
                  value={lessonDetails.homework}
                  onChange={(e) => setLessonDetails(prev => ({ ...prev, homework: e.target.value }))}
                  placeholder="Describe the homework or assignment for students"
                  className="min-h-[100px]"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => setShowLessonDetails(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-primary-blue-600 hover:bg-primary-blue-700 text-white"
              onClick={handleSaveLessonDetails}
            >
              Save Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showMaterials} onOpenChange={setShowMaterials}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Class Materials</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div 
              className={`border-2 border-dashed rounded-lg transition-colors ${
                isDragging ? 'border-primary-blue-500 bg-primary-blue-50' : 'border-neutral-300'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <label 
                htmlFor="file-upload" 
                className="flex flex-col items-center justify-center w-full px-4 py-6 cursor-pointer hover:bg-neutral-50 transition-colors"
              >
                <UploadIcon size={24} className="mb-2 text-neutral-500" />
                <span className="text-sm text-neutral-600">Drag and drop files here, or click to select files</span>
                <span className="text-xs text-neutral-500 mt-1">PDF, DOCX, PPTX, etc.</span>
                <Input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                  multiple
                />
              </label>
            </div>

            {uploadingFiles.length > 0 && (
              <div className="space-y-3">
                {uploadingFiles.map((file) => (
                  <div 
                    key={file.id}
                    className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg"
                  >
                    <Loader2 size={18} className="text-primary-blue-600 animate-spin" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium">{file.file.name}</p>
                        <span className="text-xs text-neutral-500">{file.progress}%</span>
                      </div>
                      <Progress value={file.progress} className="h-1" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {materials.length > 0 ? (
              <div className="space-y-3">
                {materials.map((material) => (
                  <div 
                    key={material.id}
                    className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileText size={18} className="text-primary-blue-600" />
                      <div>
                        <p className="text-sm font-medium">{material.name}</p>
                        <p className="text-xs text-neutral-500">{material.size}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-neutral-500 hover:text-error hover:bg-error-light"
                      onClick={() => handleDelete(material.id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-neutral-500">
                <FileText size={40} className="mx-auto mb-3 text-neutral-400" />
                <p>No materials uploaded yet</p>
                <p className="text-sm">Upload files to share with your students</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}