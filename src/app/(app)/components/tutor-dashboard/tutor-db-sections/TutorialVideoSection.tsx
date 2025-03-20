'use client'

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../../base-v2/ui/Card";
import { ClassType } from '~/lib/classes/types/class-v2';
import { UpcomingSession } from '~/lib/sessions/types/session-v2';

const TutorialVideoSection = () => {
  return (
    <>
      {/* Tutorial Video */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use the Platform</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-gray-100 rounded-lg">
            <iframe
              className="w-full h-full rounded-lg"
              src="/api/placeholder/800/450"
              title="Platform Tutorial"
              allowFullScreen
            />
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default TutorialVideoSection;