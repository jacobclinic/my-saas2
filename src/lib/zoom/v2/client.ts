import axios, { AxiosInstance } from "axios";
import { ZoomCreateUserMeetingRequest, ZoomCreateUserRequest, ZoomCreateUserResponse, ZoomMeetingRecordingResponse, ZoomMeetingResponse, ZoomUserResponse, ZoomRegistrant, ZoomRegistrationResponse, ZoomUpdateRegistrantStatusRequest } from "./types";

export class ZoomClient {
    private axiosClient: AxiosInstance;
    private accessToken: string | null = null;
    private tokenExpiresAt: number = 0;

    private zoomClientId: string;
    private zoomClientSecret: string;
    private zoomAccountId: string;

    constructor() {
        this.zoomClientId = process.env.ZOOM_CLIENT_ID || '';
        this.zoomClientSecret = process.env.ZOOM_CLIENT_SECRET || '';
        this.zoomAccountId = process.env.ZOOM_ACCOUNT_ID || '';
        this.axiosClient = axios.create({
            baseURL: 'https://api.zoom.us/v2',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        this.axiosClient.interceptors.request.use(async (config) => {
            if (!this.accessToken || Date.now() >= this.tokenExpiresAt) {
                await this.refreshToken();
            }
            config.headers.Authorization = `Bearer ${this.accessToken}`;
            return config;
        });
    }

    private async refreshToken() {
        try {
            const accessToken = await this.getAccessToken();
            this.accessToken = accessToken;
            this.tokenExpiresAt = Date.now() + (2 * 60 * 60 * 1000); // 2 hours
        } catch (error) {
            console.error('Error refreshing Zoom token:', error);
        }
    }

    private async getAccessToken(): Promise<string> {
        const authHeader = Buffer.from(
            `${this.zoomClientId}:${this.zoomClientSecret}`,
        ).toString('base64');

        const response = await axios.post(
            'https://zoom.us/oauth/token',
            {
                grant_type: 'account_credentials',
                account_id: this.zoomAccountId,
                scope: 'meeting:write meeting:update meeting:read',
            },
            {
                headers: {
                    Authorization: `Basic ${authHeader}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            },
        );

        return response.data.access_token;
    }

    async getAllUsers(): Promise<any[]> {
        const response = await this.axiosClient.get('/users');
        return response.data;
    }

    async createUser(createUserRequest: ZoomCreateUserRequest): Promise<ZoomCreateUserResponse> {
        const response = await this.axiosClient.post('/users', createUserRequest);
        return response.data;
    }

    async createUserMeeting(createUserMeetingRequest: ZoomCreateUserMeetingRequest): Promise<ZoomMeetingResponse> {
        const body = createUserMeetingRequest.body;
        const response = await this.axiosClient.post(`/users/${createUserMeetingRequest.userId}/meetings`, body);
        return response.data;
    }

    async getUserMeetings(userId: string): Promise<ZoomMeetingResponse> {
        const response = await this.axiosClient.get(`/users/${userId}/meetings`);
        return response.data;
    }

    async getMeetingRecordings(meetingId: string): Promise<ZoomMeetingRecordingResponse> {
        const encodedMeetingId = meetingId.includes('/')
            ? encodeURIComponent(encodeURIComponent(meetingId))
            : meetingId;
        const response = await this.axiosClient.get(`/meetings/${encodedMeetingId}/recordings`);
        return response.data;
    }

    async getUserById(userId: string): Promise<ZoomUserResponse> {
        const response = await this.axiosClient.get(`/users/${userId}`);
        return response.data;
    }

    // --- NEW METHODS FOR REGISTRATION FLOW ---
    async registerParticipant(meetingId: string, registrant: ZoomRegistrant): Promise<ZoomRegistrationResponse> {
        const response = await this.axiosClient.post(`/meetings/${meetingId}/registrants`, registrant);
        return response.data;
    }

    async updateRegistrantStatus(meetingId: string, statusUpdate: ZoomUpdateRegistrantStatusRequest): Promise<void> {
        await this.axiosClient.put(`/meetings/${meetingId}/registrants/status`, statusUpdate);
    }

}

export const zoomClient = new ZoomClient();