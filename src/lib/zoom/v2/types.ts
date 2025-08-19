import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "~/database.types";

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

interface ZoomParticipantLeftPayload {
    account_id: string;
    object: {
        uuid: string;
        participant: {
            customer_key: string;
            leave_time: string;
            public_ip: string;
            user_id: string;
            user_name: string;
            registrant_id: string;
            participant_user_id: string;
            id: string;
            leave_reason: string;
            email: string;
            private_ip: string;
            participant_uuid: string;
        };
        id: string;
        type: number;
        topic: string;
        host_id: string;
        duration: number;
        start_time: string;
        timezone: string;
    };
}

export type ZoomWebhookEvent = BaseZoomWebhookPayload<'meeting.ended', ZoomMeetingEndedPayload> | BaseZoomWebhookPayload<
    'endpoint.url_validation',
    ZoomUrlValidationPayload
> | BaseZoomWebhookPayload<
    'meeting.participant_left',
    ZoomParticipantLeftPayload
>

// Keep the old interface for backward compatibility if needed elsewhere
export interface ZoomParticipantLeftWebhookPayload {
    payload: ZoomParticipantLeftPayload;
    event_ts: number;
    event: string;
}

export type ZoomUserType = 1 | 2 | 3; // 1=Basic, 2=Licensed, 3=On-prem
export type ZoomCreateUserAction = 'create' | 'autoCreate' | 'custCreate' | 'ssoCreate';

export type ZoomUserFeature = {
    zoom_phone: boolean;
}

export type ZoomUserRequestInfo = {
    email?: string;
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

export type CommaZoomUser = Omit<ZoomUser, 'first_name' | 'last_name' | 'type'> & {
    zoom_user_id: string;
    account_type: ZoomUserType;
}

export type ZoomCreateUserResponse = ZoomUser;

export type ZoomUserResponse = {
    id: string;
    type: 1 | 2 | 4 | 99; // 1=Basic, 2=Licensed, 4=Unassigned without Meetings Basic, 99=None

    created_at?: string;
    dept?: string;
    email?: string;
    first_name?: string;
    last_client_version?: string;
    last_login_time?: string;
    last_name?: string;
    pmi?: number;
    role_name?: string;
    timezone?: string;
    use_pmi?: boolean;
    display_name?: string;

    account_id?: string;
    account_number?: number;
    cms_user_id?: string;
    company?: string;
    user_created_at?: string;
    custom_attributes?: Array<{
        key: string;
        name: string;
        value: string;
    }>;
    employee_unique_id?: string;
    group_ids?: string[];
    im_group_ids?: string[];
    jid?: string;
    job_title?: string;
    cost_center?: string;
    language?: string;
    location?: string;
    login_types?: Array<0 | 1 | 11 | 21 | 23 | 24 | 27 | 97 | 98 | 99 | 100 | 101>;
    manager?: string;
    personal_meeting_url?: string;
    phone_country?: string; // deprecated
    phone_number?: string; // deprecated
    phone_numbers?: Array<{
        code: string;
        country: string;
        label: 'Mobile' | 'Office' | 'Home' | 'Fax';
        number: string;
        verified: boolean;
    }>;
    pic_url?: string;
    plan_united_type?: '1' | '2' | '4' | '8' | '16' | '32' | '64' | '128' | '256' | '512' | '1024' | '2048' | '4096' | '8192' | '16384' | '32768' | '65536' | '131072';
    pronouns?: string;
    pronouns_option?: 1 | 2 | 3;
    role_id?: string;
    status?: 'pending' | 'active' | 'inactive';
    vanity_url?: string;
    verified?: number; // 1=verified, 0=not verified
    cluster?: string;
    zoom_one_type?: number;
}

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

export type ZoomRecordingFileType = {
    deleted_time?: string;
    download_url: string;
    file_path: string;
    file_size: number;
    file_type: string;
    file_extension?: string;
    id: string;
    meeting_id: string;
    play_url: string;
    recording_end: string;
    recording_start: string;
    recording_type?: string;
    status: string;
}

export type ZoomParticipantAudioFile = {
    download_url: string;
    file_name: string;
    file_path: string;
    file_size: number;
    file_type: string;
    id: string;
    play_url: string;
    recording_end: string;
    recording_start: string;
    status: string;
}

export type ZoomMeetingRecordingResponse = {
    account_id: string;
    duration: number;
    host_id: string;
    id: number;
    recording_count: number;
    start_time: string;
    topic: string;
    total_size: number;
    type: string;
    uuid: string;
    recording_play_passcode?: string;
    auto_delete?: boolean;
    auto_delete_date?: string;
    recording_files: ZoomRecordingFileType[];
    download_access_token?: string;
    password?: string;
    participant_audio_files?: ZoomParticipantAudioFile[];
}

export type Client = SupabaseClient<Database>;

export type ZoomMeetingRecordingUrl = {
    play_url: string;
    download_url: string;
}