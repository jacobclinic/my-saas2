'use client'

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../base-v2/ui/Card";
import { Button } from "../base-v2/ui/Button";
import { Badge } from "../base-v2/ui/Badge";
import { Alert, AlertDescription } from "../base-v2/ui/Alert";
import {
  Video,
  Clock,
  Calendar,
  File,
  DollarSign,
  Camera,
  Download,
  AlertTriangle,
  Info,
  MonitorPlay
} from 'lucide-react';

const StudentPortal = () => {
  // Sample data
  const nextClass = {
    id: 1,
    name: "A/L 2025 Accounting Batch 04",
    topic: "Manufacturing Accounts - Part 1",
    date: "Monday, Dec 18, 2024",
    time: "4:00 PM - 6:00 PM",
    zoomLink: "https://zoom.us/j/123456789",
    paymentStatus: "pending",
    paymentAmount: 5000,
    materials: [
      { id: 1, name: "Manufacturing Accounts Notes.pdf", size: "2.5 MB" },
      { id: 2, name: "Practice Problems Set.pdf", size: "1.8 MB" }
    ]
  };

  const upcomingClasses = [
    {
      id: 2,
      name: "A/L 2025 Accounting Batch 04",
      topic: "Manufacturing Accounts - Part 2",
      date: "Monday, Dec 25, 2024",
      time: "4:00 PM - 6:00 PM",
      paymentStatus: "paid",
      materials: [
        { id: 3, name: "Manufacturing Accounts Part 2.pdf", size: "3.0 MB" }
      ]
    }
  ];

  const pastClasses = [
    {
      id: 3,
      name: "A/L 2025 Accounting Batch 04",
      topic: "Introduction to Manufacturing Accounts",
      date: "Monday, Dec 11, 2024",
      time: "4:00 PM - 6:00 PM",
      recordingUrl: "https://zoom.us/rec/123",
      materials: [
        { id: 4, name: "Introduction Notes.pdf", size: "2.2 MB" },
        { id: 5, name: "Homework Problems.pdf", size: "1.5 MB" }
      ]
    }
  ];

  const NextClassCard = ({ classData }) => (
    <Card className="border-2 border-blue-200 bg-blue-50">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl text-blue-800">Next Class</CardTitle>
            <p className="text-blue-700 font-medium mt-1">{classData.name}</p>
          </div>
          {classData.paymentStatus === "pending" && (
            <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100">
              Payment Pending
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="font-medium text-blue-900">{classData.topic}</h3>
          <div className="flex items-center text-blue-700">
            <Calendar className="h-4 w-4 mr-2" />
            {classData.date}
          </div>
          <div className="flex items-center text-blue-700">
            <Clock className="h-4 w-4 mr-2" />
            {classData.time}
          </div>
        </div>

        {classData.paymentStatus === "pending" ? (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              Please complete the payment of Rs. {classData.paymentAmount} to access the class
            </AlertDescription>
          </Alert>
        ) : null}

        {classData.materials?.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-blue-900">Class Materials</h4>
            <div className="space-y-2">
              {classData.materials.map((material) => (
                <div
                  key={material.id}
                  className="flex items-center justify-between bg-white p-2 rounded"
                >
                  <div className="flex items-center">
                    <File className="h-4 w-4 text-blue-600 mr-2" />
                    <span className="text-sm">{material.name}</span>
                  </div>
                  <span className="text-sm text-gray-600">{material.size}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {classData.paymentStatus === "pending" ? (
            <Button className="w-full bg-red-600 hover:bg-red-700" onClick={() => window.location.href = `/payment/${classData.id}`}>
              <DollarSign className="h-4 w-4 mr-2" />
              Make Payment
            </Button>
          ) : (
            <Button className="w-full" onClick={() => window.open(classData.zoomLink, '_blank')}>
              <Camera className="h-4 w-4 mr-2" />
              Join Class
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const ClassCard = ({ classData, type = "upcoming" }) => (
    <Card className="mb-4">
      <CardContent className="p-4 space-y-4">
        <div>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium">{classData.name}</h3>
              <p className="text-blue-600">{classData.topic}</p>
            </div>
            {classData.paymentStatus === "pending" && type === "upcoming" && (
              <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100">
                Payment Pending
              </Badge>
            )}
          </div>
          <div className="flex items-center mt-2 text-gray-600">
            <Calendar className="h-4 w-4 mr-2" />
            {classData.date}
          </div>
          <div className="flex items-center mt-1 text-gray-600">
            <Clock className="h-4 w-4 mr-2" />
            {classData.time}
          </div>
        </div>

        {classData.materials?.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Class Materials</h4>
            <div className="space-y-2">
              {classData.materials.map((material) => (
                <div
                  key={material.id}
                  className="flex items-center justify-between bg-gray-50 p-2 rounded"
                >
                  <div className="flex items-center">
                    <File className="h-4 w-4 text-blue-600 mr-2" />
                    <span className="text-sm">{material.name}</span>
                  </div>
                  <span className="text-sm text-gray-600">{material.size}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {type === "upcoming" ? (
            <>
              {classData.paymentStatus === "pending" ? (
                <Button className="bg-red-600 hover:bg-red-700" onClick={() => window.location.href = `/payment/${classData.id}`}>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Make Payment
                </Button>
              ) : (
                <Button onClick={() => window.open(classData.zoomLink, '_blank')}>
                  <Camera className="h-4 w-4 mr-2" />
                  Join Class
                </Button>
              )}
            </>
          ) : (
            <>
              <Button onClick={() => window.open(classData.recordingUrl, '_blank')}>
                <Video className="h-4 w-4 mr-2" />
                Watch Recording
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download Materials
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Tips Alert */}
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-700">
            Join your class 5 minutes early to ensure a smooth start. Don&apos;t forget to check the class materials beforehand!
          </AlertDescription>
        </Alert>

        {/* Next Class */}
        {nextClass && <NextClassCard classData={nextClass} />}

        {/* Upcoming Classes */}
        {upcomingClasses.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              <h2 className="text-xl font-bold">Upcoming Classes</h2>
            </div>
            {upcomingClasses.map(classData => (
              <ClassCard key={classData.id} classData={classData} type="upcoming" />
            ))}
          </div>
        )}

        {/* Past Classes */}
        {pastClasses.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center">
              <MonitorPlay className="h-5 w-5 mr-2" />
              <h2 className="text-xl font-bold">Past Classes</h2>
            </div>
            {pastClasses.map(classData => (
              <ClassCard key={classData.id} classData={classData} type="past" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentPortal;