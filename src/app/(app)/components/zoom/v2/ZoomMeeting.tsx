import { useEffect } from "react";
import ZoomMtgEmbedded from "@zoom/meetingsdk/embedded";
import { generateZoomSdkSignature } from '~/lib/zoom/v2/actions';
import useUserRole from '~/lib/user/hooks/use-userRole';

type ZoomMeetingProps = {
    params: {
        classId: string;
        sessionId: string;
        zoomSession: any;
    };
};

const ZoomMeeting = ({ params }: ZoomMeetingProps) => {
    const client = ZoomMtgEmbedded.createClient();
    const { data: role, isLoading } = useUserRole();

    const isHost = role === "tutor" || role === "admin";
    const meetingNumber = params.zoomSession?.meeting_id;
    const password = params.zoomSession?.password;
    const userName = params.zoomSession?.tutor?.first_name;
    const userEmail = params.zoomSession?.tutor?.email;

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
            await client.init({
                zoomAppRoot: meetingSDKElement,
                language: "en-US",
                patchJsMedia: true,
                leaveOnPageUnload: true,
                customize: {
                    video: {
                        isResizable: true,
                        viewSizes: {
                            default: {
                                width: 1600,
                                height: 800
                            },
                            ribbon: {
                                width: 1600,
                                height: 800
                            }
                        }
                    }
                }
            });

            await client.join({
                signature,
                meetingNumber,
                password,
                userName,
                userEmail,
            });
            console.log("joined successfully");
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        if (!isLoading && meetingNumber && password && userName && userEmail) {
            getSignature();
        }
    }, [isLoading, meetingNumber, password, userName, userEmail]);

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