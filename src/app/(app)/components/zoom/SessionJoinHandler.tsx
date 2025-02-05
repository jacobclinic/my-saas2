// components/zoom/SessionJoinHandler.tsx

"use client";

import { useState } from "react";
import { Button } from "../base-v2/ui/Button";
import { VideoMeetingView } from "./VideoMeetingView";
import { Card, CardContent, CardHeader, CardTitle } from "../base-v2/ui/Card";

interface SessionJoinHandlerProps {
  sessionName: string;
  hostToken: string;
  participantToken: string;
  isHost: boolean;
  userName: string;
  onLeave?: () => void;
}

export default function SessionJoinHandler({
  sessionName,
  hostToken,
  participantToken,
  isHost,
  userName,
  onLeave
}: SessionJoinHandlerProps) {
  const [hasJoined, setHasJoined] = useState(false);

  if (!hasJoined) {
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>Join Session: {sessionName}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            {isHost
              ? "Get ready to start your session. Make sure your camera and microphone are working properly."
              : "Your tutor's session is ready. Click join to enter the virtual classroom."}
          </p>
          <Button
            className="w-full"
            onClick={() => setHasJoined(true)}
          >
            {isHost ? "Start Session" : "Join Session"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <VideoMeetingView
      sessionName={sessionName}
      token={isHost ? hostToken : participantToken}
      userName={userName}
      isHost={isHost}
      onLeave={() => {
        setHasJoined(false);
        onLeave?.();
      }}
    />
  );
}