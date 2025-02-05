// app/(app)/components/zoom/MeetingContainer.tsx

"use client";

import loadDynamic from 'next/dynamic';
import { useRouter } from "next/navigation";
// import SessionJoinHandler from "./SessionJoinHandler";

const SessionJoinHandler = loadDynamic(
  () => import("./SessionJoinHandler"),
  {
    ssr: false,
  },
);

interface MeetingContainerProps {
  sessionData: {
    name: string;
    hostToken: string;
    participantToken: string;
    isHost: boolean;
    userName: string;
  };
}

export function MeetingContainer({ sessionData }: MeetingContainerProps) {
  const router = useRouter();

  const handleLeave = () => {
    // router.push("/upcoming-sessions");
  };

  return (
    <div className="container py-8">
      <SessionJoinHandler
        sessionName={sessionData.name}
        hostToken={sessionData.hostToken}
        participantToken={sessionData.participantToken}
        isHost={sessionData.isHost}
        userName={sessionData.userName}
        onLeave={handleLeave}
      />
    </div>
  );
}