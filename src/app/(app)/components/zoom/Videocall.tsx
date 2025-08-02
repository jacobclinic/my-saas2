"use client";

import { CSSProperties, useRef, useState } from "react";
import ZoomVideo, {
  type VideoClient,
  VideoQuality,
  type VideoPlayer,
} from "@zoom/videosdk";
import { CameraButton, MicButton } from "./MuteButtons";
// import { WorkAroundForSafari } from "@/lib/utils";
import { PhoneOff } from "lucide-react";
import { Button } from "../base-v2/ui/Button";
import { WorkAroundForSafari } from "~/lib/utils/media-sdk-change-safari-utils";

const Videocall = (props: { slug: string; JWT: string }) => {
  const session = props.slug;
  const jwt = props.JWT;
  const [inSession, setInSession] = useState(false);
  const client = useRef<typeof VideoClient>(ZoomVideo.createClient());
  const [isVideoMuted, setIsVideoMuted] = useState(
    !client.current.getCurrentUserInfo()?.bVideoOn
  );
  const [isAudioMuted, setIsAudioMuted] = useState(
    client.current.getCurrentUserInfo()?.muted ?? true
  );
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [isRecording, setIsRecording] = useState(false);

  const joinSession = async () => {
    await client.current.init("en-US", "Global", { patchJsMedia: true });
    client.current.on(
      "peer-video-state-change",
      (payload) => void renderVideo(payload)
    );
    await client.current.join(session, jwt, userName).catch((e) => {
      console.log(e);
    });
    setInSession(true);
    const mediaStream = client.current.getMediaStream();
    // @ts-expect-error https://stackoverflow.com/questions/7944460/detect-safari-browser/42189492#42189492
    window.safari
      ? await WorkAroundForSafari(client.current)
      : await mediaStream.startAudio();
    setIsAudioMuted(client.current.getCurrentUserInfo().muted ?? true);
    await mediaStream.startVideo();
    setIsVideoMuted(!client.current.getCurrentUserInfo().bVideoOn);
    await renderVideo({
      action: "Start",
      userId: client.current.getCurrentUserInfo().userId,
    });
  };

  const renderVideo = async (event: {
    action: "Start" | "Stop";
    userId: number;
  }) => {
    const mediaStream = client.current.getMediaStream();
    if (event.action === "Stop") {
      const element = await mediaStream.detachVideo(event.userId);
      Array.isArray(element)
        ? element.forEach((el) => el.remove())
        : element.remove();
    } else {
      const userVideo = await mediaStream.attachVideo(
        event.userId,
        VideoQuality.Video_360P
      );
      videoContainerRef.current!.appendChild(userVideo as VideoPlayer);
    }
  };

  // Function to start recording
  const startRecording = async () => {
    try {
      // Pass options as required (e.g., specifying cloud recording)
      const recordingClient = await client.current.getRecordingClient();
      const response = await recordingClient.startCloudRecording();
      console.log("Recording started:", response);
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  // Function to stop recording
  const stopRecording = async () => {
    try {
      const recordingClient = await client.current.getRecordingClient();
      const response = await recordingClient.stopCloudRecording();
      console.log("Recording stopped:", response);
      setIsRecording(false);
    } catch (error) {
      console.error("Error stopping recording:", error);
    }
  };

  const leaveSession = async () => {
    client.current.off(
      "peer-video-state-change",
      (payload: { action: "Start" | "Stop"; userId: number }) =>
        void renderVideo(payload)
    );
    await client.current.leave().catch((e) => console.log("leave error", e));
    // hard refresh to clear the state
    window.location.href = "/upcoming-sessions";
  };

  return (
    <div className="flex h-full w-full flex-1 flex-col">
      <h1 className="text-center text-3xl font-bold mb-4 mt-0">
        Session: {session}
      </h1>
      <div
        className="flex w-full flex-1"
        style={inSession ? {} : { display: "none" }}
      >
        {/* @ts-expect-error html component */}
        <video-player-container className="h-full w-full [&>*]:!h-[50%]" ref={videoContainerRef} style={videoPlayerStyle} muted autoPlay ></video-player-container>
        {/* <video-player-container ref={videoContainerRef} style={videoPlayerStyle} /> */}

      </div>
      {!inSession ? (
        <div className="mx-auto flex w-64 flex-col self-center">
          <div className="w-4" />
          <Button className="flex flex-1" onClick={joinSession} title="join session">
            Join
          </Button>
        </div>
      ) : (
        <div className="flex w-full flex-col justify-around self-center">
          <div className="mt-4 flex w-[30rem] flex-1 justify-around self-center rounded-md bg-white p-4">
            <CameraButton
              client={client}
              isVideoMuted={isVideoMuted}
              setIsVideoMuted={setIsVideoMuted}
              renderVideo={renderVideo}
            />
            <MicButton
              isAudioMuted={isAudioMuted}
              client={client}
              setIsAudioMuted={setIsAudioMuted}
            />
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              title={isRecording ? "Stop Recording" : "Start Recording"}
            >
              {isRecording ? "Stop Recording" : "Start Recording"}
            </Button>
            <Button onClick={leaveSession} title="leave session">
              <PhoneOff />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Videocall;

const videoPlayerStyle = {
  height: "75vh",
  width: "60vw",
  marginTop: "1.5rem",
  marginLeft: "3rem",
  marginRight: "3rem",
  alignContent: "center",
  borderRadius: "10px",
  overflow: "hidden",
  '> video-player': {
    height: "100%",
  },
} as CSSProperties;

const userName = `User-${new Date().getTime().toString().slice(8)}`;
