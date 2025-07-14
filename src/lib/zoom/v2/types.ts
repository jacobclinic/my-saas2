type ZoomUserType = 1 | 2 | 3; // 1=Basic, 2=Licensed, 3=On-prem
type ZoomCreateUserAction = 'create' | 'autoCreate' | 'custCreate' | 'ssoCreate';

type ZoomUserFeature = {
    zoom_phone: boolean;
}

type ZoomUserRequestInfo = {
    email: string;
    first_name?: string;
    last_name?: string;
    display_name?: string;
    password?: string;
    type: ZoomUserType;
    feature?: ZoomUserFeature;
    plan_united_type?: string;
}

type ZoomCreateUserRequest = {
    action: ZoomCreateUserAction;
    user_info: ZoomUserRequestInfo;
}

type ZoomUser = {
    email: string;
    first_name: string;
    id: string;
    last_name: string;
    type: ZoomUserType;
}

type ZoomCreateUserResponse = ZoomUser;

// Can extend this.
// https://developers.zoom.us/docs/api/meetings/#tag/meetings/POST/users/{userId}/meetings
type ZoomMeetingType = 1 | 2 | 3 | 8 | 10;

type ZoomCreateUserMeetingRequest = {
    userId: string;
    body: {
        topic: string;
        agenda: string;
        default_password: boolean;
        duration: number;
        password: string;
        pre_schedule?: boolean;
        start_time: string;
        timezone?: string;
        type?: ZoomMeetingType;
    }
}


type ZoomMeetingResponse = {
    id?: number;
    uuid?: string;
    host_email?: string;
    topic?: string;
    type?: number;
    status?: string;
    start_time?: string;
    duration?: number;
    timezone?: string;
    agenda?: string;
    created_at?: string;
    start_url?: string;
    join_url?: string;
    password?: string;
    h323_password?: string;
    pstn_password?: string;
    encrypted_password?: string;
    registration_url?: string;
    pmi?: string;
    settings?: {
        host_video?: boolean;
        participant_video?: boolean;
        join_before_host?: boolean;
        mute_upon_entry?: boolean;
        use_pmi?: boolean;
        approval_type?: 0 | 1 | 2;
        audio?: 'both' | 'telephony' | 'voip' | 'thirdParty';
        auto_recording?: 'local' | 'cloud' | 'none';
        alternative_hosts?: string;
        waiting_room?: boolean;
        meeting_authentication?: boolean;
    };
}
