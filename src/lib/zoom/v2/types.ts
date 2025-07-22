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

export type ZoomWebhookEvent = BaseZoomWebhookPayload<
    'meeting.ended',
    ZoomMeetingEndedPayload
> | BaseZoomWebhookPayload<
    'endpoint.url_validation',
    ZoomUrlValidationPayload
>