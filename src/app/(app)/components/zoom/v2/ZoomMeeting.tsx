'use client'

import { useEffect } from "react";
import ZoomMtgEmbedded from "@zoom/meetingsdk/embedded";
import { generateZoomSdkSignature } from '~/lib/zoom/v2/actions';
import useUserRole from '~/lib/user/hooks/use-userRole';

import { ZoomMtg } from '@zoom/meetingsdk'

ZoomMtg.preLoadWasm()
ZoomMtg.prepareWebSDK()

type ZoomMeetingProps = {
    params: {
        classId: string;
        sessionId: string;
        zoomSession: any;
        userEmail: string;
        userName: string;
    };
    onInitSuccess?: () => void;
    onInitError?: (error: any) => void;
    onJoinSuccess?: () => void;
    onJoinError?: (error: any) => void;
};

const ZoomMeeting = ({ params, onInitSuccess, onInitError, onJoinSuccess, onJoinError }: ZoomMeetingProps) => {
    const client = ZoomMtgEmbedded.createClient();
    const { data: role } = useUserRole();

    const isHost = role === "tutor" || role === "admin";
    const meetingNumber = params.zoomSession?.meeting_id;
    const password = params.zoomSession?.password;
    const userName = params.userName;
    const userEmail = params.userEmail;

    const getSignature = async () => {
        if (!meetingNumber || !password || !userName || !userEmail) {
            console.warn("Missing meeting data, cannot join meeting.");
            return;
        }
        const userRole = isHost ? 1 : 0;
        const signature = await generateZoomSdkSignature(meetingNumber, userRole);
        startMeeting(signature);
    }

    async function startMeeting(signature: string) {
        const meetingSDKElement = document.getElementById("meetingSDKElement");
        if (!meetingSDKElement) {
            console.warn("Meeting SDK element not found.");
            return;
        }
        try {
            const dashboardUrl = `${window.location.origin}/dashboard`;
            ZoomMtg.init({
                leaveUrl: dashboardUrl,
                patchJsMedia: true,
                disableInvite: true,
                disablePictureInPicture: true,
                meetingInfo: [
                    'topic',
                    'host',
                    'participant',
                    'dc',
                    'enctype',
                    'report'
                ],
                success: (success: any) => {
                    onInitSuccess && onInitSuccess();
                    ZoomMtg.join({
                        signature: signature,
                        meetingNumber: meetingNumber,
                        userName: userName,
                        userEmail: userEmail,
                        passWord: password,
                        success: (success: any) => {
                            onJoinSuccess && onJoinSuccess();
                        },
                        error: (error: any) => {
                            onJoinError && onJoinError(error);
                        }
                    })
                    ZoomMtg.showInviteFunction({ show: false });
                },
                error: (error: any) => {
                    onInitError && onInitError(error);
                }
            })
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        if (meetingNumber && password && userName && userEmail) {
            getSignature();
        }
    }, [meetingNumber, password, userName, userEmail]);

    return (
        <div className="flex-1 w-full h-screen relative">
            <main className="w-full h-full">
                <div
                    id="meetingSDKElement"
                    className="w-full h-full min-h-0 min-w-0"
                    style={{ width: '100%', height: '100%' }}
                ></div>
            </main>
        </div>
    );
};

export default ZoomMeeting;