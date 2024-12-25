'use client'

import React, { useState } from 'react';
import type {
  PastSessionData,
  LinkCopiedState,
} from '~/lib/sessions/types/past-sessions';
import { Input } from "../base-v2/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../base-v2/ui/Select";
import { Alert, AlertDescription } from "../base-v2/ui/Alert";
import { Search, Info } from 'lucide-react';
import PastSessionsCard from './PastSessionCard';

const PastSessions = () => {
  const [linkCopied, setLinkCopied] = useState<LinkCopiedState>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('all');

  const handleCopyLink = (id: number, link: string, type: string): void => {
    navigator.clipboard.writeText(link);
    setLinkCopied({ ...linkCopied, [type + '-' + id]: true });
    setTimeout(() => {
      setLinkCopied({ ...linkCopied, [type + '-' + id]: false });
    }, 2000);
  };


  // Sample past classes data
  const pastSessions: PastSessionData[] = [
    {
      id: 1,
      name: "2025 A-Levels Batch 1",
      topic: "Manufacturing Accounts - Part 1",
      date: "Monday, Dec 11, 2024",
      time: "4:00 PM - 6:00 PM",
      recordingUrl: "https://zoom.us/rec/123",
      attendance: [
        { name: "Alice Johnson", joinTime: "3:58 PM", duration: "1h 55m" },
        { name: "Bob Wilson", joinTime: "3:59 PM", duration: "1h 54m" },
        { name: "Carol Smith", joinTime: "4:02 PM", duration: "1h 52m" }
      ],
      materials: [
        { id: 1, name: "Manufacturing Accounts Notes.pdf", size: "2.5 MB", url: "https://example.com/materials/1" },
        { id: 2, name: "Practice Problems.pdf", size: "1.8 MB", url: "https://example.com/materials/2" }
      ]
    },
    {
      id: 2,
      name: "2024 A-Levels Revision Batch",
      topic: "Financial Statements Analysis",
      date: "Sunday, Dec 10, 2024",
      time: "6:30 PM - 8:30 PM",
      recordingUrl: "https://zoom.us/rec/456",
      attendance: [
        { name: "David Brown", joinTime: "6:28 PM", duration: "1h 58m" },
        { name: "Eve Clark", joinTime: "6:29 PM", duration: "1h 57m" }
      ],
      materials: [
        { id: 3, name: "Financial Analysis Notes.pdf", size: "3.2 MB", url: "https://example.com/materials/3" }
      ]
    }
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header & Search */}
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Past Classes</h1>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search by class name or topic..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Months</SelectItem>
              <SelectItem value="dec">December 2024</SelectItem>
              <SelectItem value="nov">November 2024</SelectItem>
              <SelectItem value="oct">October 2024</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-700">
            Recordings are available for 30 days after the class. Make sure to download important recordings.
          </AlertDescription>
        </Alert>
      </div>

      {/* Sessions List */}
      <div className="space-y-6">
        {pastSessions
          .filter(cls => {
            if (searchQuery) {
              return (
                cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                cls.topic.toLowerCase().includes(searchQuery.toLowerCase())
              );
            }
            return true;
          })
          .map(sessionData => (
            <PastSessionsCard
              key={sessionData.id}
              sessionData={sessionData}
              linkCopied={linkCopied}
              handleCopyLink={handleCopyLink}
            />
          ))}
      </div>
    </div>
  );
};

export default PastSessions;