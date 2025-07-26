export type ZoomWebhookPayload = {
    event: string;
    payload: any;
}

interface BaseZoomWebhookPayload<T extends string, P> {
    event: T;
    payload: P;
    event_ts: number;
}

interface ZoomUrlValidationPayload {
    plainToken: string;
}

interface ZoomMeetingEndedPayload {
    account_id: string;
    operator: string;
    operator_id: string;
    operation: string;
    object: {
        id: string;
        uuid: string;
        host_id: string;
        topic: string;
        type: number;
        start_time: string;
        timezone: string;
        duration: number;
        end_time: string;
    };
}

export type ZoomWebhookEvent = BaseZoomWebhookPayload<'meeting.ended', ZoomMeetingEndedPayload> | BaseZoomWebhookPayload<
    'endpoint.url_validation',
    ZoomUrlValidationPayload
>

export type ZoomUserType = 1 | 2 | 3; // 1=Basic, 2=Licensed, 3=On-prem
export type ZoomCreateUserAction = 'create' | 'autoCreate' | 'custCreate' | 'ssoCreate';

export type ZoomUserFeature = {
    zoom_phone: boolean;
}

export type ZoomUserRequestInfo = {
    email: string;
    first_name?: string;
    last_name?: string;
    display_name?: string;
    password?: string;
    type: ZoomUserType;
    feature?: ZoomUserFeature;
    plan_united_type?: string;
}

export type ZoomCreateUserRequest = {
    action: ZoomCreateUserAction;
    user_info: ZoomUserRequestInfo;
    tutor_id: string;
}

export type ZoomUser = {
    email: string;
    first_name: string;
    id: string;
    last_name: string;
    type: ZoomUserType;
    tutor_id: string;
}

export type ZoomCreateUserResponse = ZoomUser;

// Can extend this.
// https://developers.zoom.us/docs/api/meetings/#tag/meetings/POST/users/{userId}/meetings
export type ZoomMeetingType = 1 | 2 | 3 | 8 | 10;

export type ZoomCreateUserMeetingRequest = {
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
        auto_recording: 'local' | 'cloud' | 'none';
        email_notification?: boolean;
        join_before_host?: boolean;
        jbh_time?: 0 | 5 | 10 | 15;
    }
}

export type ZoomMeetingResponse = {
    id: number;
    uuid: string;
    host_email?: string;
    topic?: string;
    type?: number;
    status?: string;
    start_time?: string;
    duration?: number;
    timezone?: string;
    agenda?: string;
    created_at?: string;
    start_url: string;
    join_url: string;
    password?: string;
    h323_password?: string;
    pstn_password?: string;
    encrypted_password?: string;
    registration_url?: string;
    pmi?: string;
    creation_source?: "other" | "open_api" | "web_portal";
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
