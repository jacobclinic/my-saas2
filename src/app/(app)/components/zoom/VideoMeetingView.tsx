// components/zoom/VideoMeetingView.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import ZoomVideo, { VideoClient, VideoQuality, VideoPlayer } from "@zoom/videosdk";
import { Camera, Mic, MicOff, Phone, Video, VideoOff } from "lucide-react";
import { Card } from "../base-v2/ui/Card";
import { Button } from "../base-v2/ui/Button";
// import { Button } from "../ui/Button";
// import { Card } from "../ui/Card";

interface VideoMeetingProps {
  sessionName: string;
  token: string;
  userName: string;
  isHost: boolean;
  onLeave?: () => void;
}

export function VideoMeetingView({
  sessionName,
  token,
  userName,
  isHost,
  onLeave
}: VideoMeetingProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [participants, setParticipants] = useState<number[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<string>("disconnected");
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [isStreamReady, setIsStreamReady] = useState(false);
  
  const clientRef = useRef<typeof VideoClient>();
  const videoContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeSession();
    return () => {
      handleLeaveSession();
    };
  }, []);

  const initializeSession = async () => {
    try {
      // Initialize Zoom client
      clientRef.current = ZoomVideo.createClient();
      await clientRef.current.init("en-US", "Global");

      // Set up event listeners
      clientRef.current.on("peer-video-state-change", handleVideoStateChange);
      clientRef.current.on("connection-change", handleConnectionChange);
      clientRef.current.on("user-added", handleParticipantAdded);
      clientRef.current.on("user-removed", handleParticipantRemoved);
      clientRef.current.on("media-sdk-change", handleMediaSDKChange);

      // Join the session
      await clientRef.current.join(sessionName, token, userName);
      setIsConnected(true);
    
      // Wait a bit before marking as initialized
      setTimeout(() => {
        setIsInitialized(true);
      }, 1000);

      // If host, automatically start audio/video
      if (isHost) {
        await startAudioVideo();
      }
    } catch (error) {
      console.error("Failed to initialize session:", error);
    }
  };

  // Add media SDK change handler
  const handleMediaSDKChange = (payload: { action: string; type: string; result: number }) => {
    console.log("Media SDK Change:", payload);
    if (payload.type === 'audio') {
      setIsAudioLoading(false);
    }
    if (payload.type === 'video') {
      setIsVideoLoading(false);
    }
  };
  
  // Update the startAudioVideo function
  const startAudioVideo = async () => {
    if (!clientRef.current || !isInitialized) {
      console.log("Client not ready for audio/video");
      return;
    }
  
    const stream = clientRef.current.getMediaStream();
    if (!stream) {
      console.log("Stream not available");
      return;
    }
    setIsStreamReady(true);
  
    // Start audio
    try {
      setIsAudioLoading(true);
      await stream.startAudio();
      setIsAudioEnabled(true);
    } catch (error: any) {
      console.error("Failed to start audio:", error);
      // If it's the loading error, retry after a delay
      if (error?.type === 'INVALID_OPERATION') {
        setTimeout(() => startAudioVideo(), 2000);
      }
    } finally {
      setIsAudioLoading(false);
    }
  
    // Start video with a slight delay
    try {
      setIsVideoLoading(true);
      await stream.startVideo();
      setIsVideoEnabled(true);
      await renderVideo(clientRef.current.getCurrentUserInfo().userId);
    } catch (error) {
      console.error("Failed to start video:", error);
    } finally {
      setIsVideoLoading(false);
    }
  };

  // Add useEffect to monitor initialization and start audio/video
  useEffect(() => {
    if (isInitialized && isHost && !isConnected) {
      startAudioVideo();
    } else if (isInitialized && isHost && isConnected) {  // Changed !isConnected to isConnected
      startAudioVideo();
    }
  }, [isInitialized, isHost, isConnected]);

  // const startAudioVideo = async () => {
  //   if (!clientRef.current) return;
    
  //   const stream = clientRef.current.getMediaStream();
  //   try {
  //     await stream.startAudio();
  //     setIsAudioEnabled(true);
  //   } catch (error) {
  //     console.error("Failed to start audio:", error);
  //   }

  //   try {
  //     await stream.startVideo();
  //     setIsVideoEnabled(true);
  //     await renderVideo(clientRef.current.getCurrentUserInfo().userId);
  //   } catch (error) {
  //     console.error("Failed to start video:", error);
  //   }
  // };

  const handleVideoStateChange = async (event: { action: "Start" | "Stop"; userId: number }) => {
    if (event.action === "Start") {
      await renderVideo(event.userId);
    } else {
      await removeVideo(event.userId);
    }
  };

  const handleConnectionChange = (payload: { state: string }) => {
    setConnectionStatus(payload.state);
    
    // If disconnected, clean up videos
    if (payload.state === "Disconnected") {
      if (videoContainerRef.current) {
        videoContainerRef.current.innerHTML = '';
      }
    }
  };
  
  const handleParticipantAdded = (payload: { userId: number }) => {
    setParticipants(prev => [...prev, payload.userId]);
  };
  
  const handleParticipantRemoved = (payload: { userId: number }) => {
    setParticipants(prev => prev.filter(id => id !== payload.userId));
    removeVideo(payload.userId);
  };

  

  const renderVideo = async (userId: number) => {
    if (!clientRef.current || !videoContainerRef.current) {
      console.log("Missing refs:", { client: !!clientRef.current, container: !!videoContainerRef.current });
      return;
    }

    try {
      const stream = clientRef.current.getMediaStream();
      console.log("Got media stream:", !!stream);
      const videoElement = await stream.attachVideo(
        userId,
        VideoQuality.Video_360P,
        undefined
      );
      console.log("Video element created:", !!videoElement);
      
      if (videoElement && 'nodeName' in videoElement) {
        const videoContainer = document.createElement('div');
        videoContainer.className = 'video-tile';
        videoContainer.setAttribute('data-user-id', userId.toString());
        
        videoContainer.appendChild(videoElement as Node);
        videoContainerRef.current.appendChild(videoContainer);

        adjustVideoLayout();
      } else {
        console.error('Failed to create video element');
      }
    } catch (error) {
      console.error('Failed to render video:', error);
    }
  };


	const adjustVideoLayout = () => {
			if (!videoContainerRef.current) return;
		
			const tiles = videoContainerRef.current.querySelectorAll('.video-tile');
			const count = tiles.length;
		
			tiles.forEach((tile: Element) => {
				if (tile instanceof HTMLElement) {
					// Adjust tile size based on participant count
					if (count === 1) {
						tile.style.width = '100%';
						tile.style.height = '100%';
					} else if (count === 2) {
						tile.style.width = '50%';
						tile.style.height = '100%';
					} else if (count <= 4) {
						tile.style.width = '50%';
						tile.style.height = '50%';
					} else {
						tile.style.width = '33.33%';
						tile.style.height = '33.33%';
					}
				}
			});
	};

  const removeVideo = async (userId: number) => {
    if (!clientRef.current) return;

    try {
      const stream = clientRef.current.getMediaStream();
      const element = await stream.detachVideo(userId);
      
      if (Array.isArray(element)) {
        element.forEach(el => {
          if ('nodeName' in el) {
            el.remove();
          }
        });
      } else if (element && 'nodeName' in element) {
        element.remove();
      }

      const container = videoContainerRef.current?.querySelector(
        `[data-user-id="${userId}"]`
      );
      container?.remove();

      adjustVideoLayout();
    } catch (error) {
      console.error('Failed to remove video:', error);
    }
  };

  const toggleAudio = async () => {
    if (!clientRef.current) return;

    const stream = clientRef.current.getMediaStream();
    if (isAudioEnabled) {
      await stream.muteAudio();
    } else {
      await stream.unmuteAudio();
    }
    setIsAudioEnabled(!isAudioEnabled);
  };

  const toggleVideo = async () => {
    if (!clientRef.current) return;

    const stream = clientRef.current.getMediaStream();
    if (isVideoEnabled) {
      await stream.stopVideo();
      await removeVideo(clientRef.current.getCurrentUserInfo().userId);
    } else {
      await stream.startVideo();
      await renderVideo(clientRef.current.getCurrentUserInfo().userId);
    }
    setIsVideoEnabled(!isVideoEnabled);
  };

  const handleLeaveSession = async () => {
    if (!clientRef.current) return;

    try {
      await clientRef.current.leave();
      setIsConnected(false);
      onLeave?.();
    } catch (error) {
      console.error("Failed to leave session:", error);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{sessionName}</h2>
            <p className="text-sm text-gray-500">
              {isHost ? "Host" : "Participant"}: {userName}
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleAudio}
              className={!isAudioEnabled ? "bg-red-50" : ""}
              disabled={isAudioLoading}
            >
              {isAudioLoading ? (
                <div className="animate-spin h-4 w-4 border-2 border-gray-500 rounded-full" />
              ) : isAudioEnabled ? (
                <Mic className="h-4 w-4" />
              ) : (
                <MicOff className="h-4 w-4 text-red-500" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleVideo}
              className={!isVideoEnabled ? "bg-red-50" : ""}
            >
              {isVideoEnabled ? (
                <Video className="h-4 w-4" />
              ) : (
                <VideoOff className="h-4 w-4 text-red-500" />
              )}
            </Button>
            <Button
              variant="destructive"
              size="icon"
              onClick={handleLeaveSession}
            >
              <Phone className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div
          ref={videoContainerRef}
          className="w-full aspect-video bg-gray-100 rounded-lg overflow-hidden"
          style={{ minHeight: '400px' }}  // Add minimum height
        >
          {!isStreamReady && (
            <div className="text-gray-500">Initializing video...</div>
          )}
        </div>
      </div>
    </Card>
  );
}