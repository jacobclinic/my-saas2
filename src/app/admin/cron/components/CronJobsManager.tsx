'use client';

import { useState } from 'react';
import Button from '~/core/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '~/app/(app)/components/base-v2/ui/Card';
import { toast } from 'sonner';
import { triggerCronJob } from '../actions';

interface CronJob {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  icon: React.ReactNode;
}

const cronJobs: CronJob[] = [
  {
    id: 'zoom-sessions',
    name: 'Create Zoom Sessions',
    description: 'Creates Zoom meetings for tomorrow\'s sessions and registers enrolled students',
    endpoint: '/api/public/cron/create-zoom-sessions',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.99 10.86L15.14 2l-1.42 1.42 6.86 6.86H4c-2.21 0-4 1.79-4 4s1.79 4 4 4h16.58l-6.86 6.86 1.42 1.42 8.85-8.86z"/>
      </svg>
    ),
  },
  {
    id: 'tutor-invoices',
    name: 'Generate Tutor Invoices',
    description: 'Generates monthly invoices for tutors based on completed sessions',
    endpoint: '/api/public/cron/tutor-invoices',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
        <polyline points="14,2 14,8 20,8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10,9 9,9 8,9"/>
      </svg>
    ),
  },
  {
    id: 'student-invoices',
    name: 'Generate Student Invoices',
    description: 'Generates monthly invoices for students based on class enrollments',
    endpoint: '/api/public/cron/student-invoices',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
        <polyline points="14,2 14,8 20,8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10,9 9,9 8,9"/>
      </svg>
    ),
  },
  {
    id: 'payment-reminder',
    name: 'Payment Reminders',
    description: 'Sends payment reminder emails to students 3 days before due dates',
    endpoint: '/api/public/cron/paymentReminder',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M3 8l7.89 5.26a2 2 0 0 0 2.22 0L21 8M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z"/>
      </svg>
    ),
  },
  {
    id: 'notifications',
    name: 'Session Notifications',
    description: 'Sends various session notifications (24h, 1h reminders, post-session)',
    endpoint: '/api/public/cron/notification',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    ),
  },
];

export default function CronJobsManager() {
  const [loadingJobs, setLoadingJobs] = useState<Set<string>>(new Set());

  const handleTriggerCronJob = async (job: CronJob) => {
    const jobId = job.id;

    // Add to loading set
    setLoadingJobs(prev => new Set(prev).add(jobId));

    try {
      const result = await triggerCronJob(job.endpoint);

      if (result.success) {
        toast.success(`${job.name} triggered successfully`, {
          description: result.message,
        });
      } else {
        toast.error(`Failed to trigger ${job.name}`, {
          description: result.error || result.message,
        });
      }
    } catch (error) {
      console.error(`Error triggering ${job.name}:`, error);
      toast.error(`Failed to trigger ${job.name}`, {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      // Remove from loading set
      setLoadingJobs(prev => {
        const newSet = new Set(prev);
        newSet.delete(jobId);
        return newSet;
      });
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {cronJobs.map((job) => (
        <Card key={job.id} className="relative">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                {job.icon}
              </div>
              {job.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm mb-4">
              {job.description}
            </p>
            <Button
              onClick={() => handleTriggerCronJob(job)}
              disabled={loadingJobs.has(job.id)}
              className="w-full"
              variant="default"
            >
              {loadingJobs.has(job.id) ? 'Running...' : 'Run Now'}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}