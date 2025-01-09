import { CreateZoomMeetingRequest, ZoomMeetingResponse, ZoomTokenResponse } from './types/zoom.types';

class ZoomService {
  private clientId: string;
  private clientSecret: string;
  private accountId: string;
  private baseUrl: string = 'https://api.zoom.us/v2';
  private tokenUrl: string = 'https://zoom.us/oauth/token';
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.clientId = process.env.ZOOM_CLIENT_ID || '';
    this.clientSecret = process.env.ZOOM_CLIENT_SECRET || '';
    this.accountId = process.env.ZOOM_ACCOUNT_ID || '';
  }

  private async getAccessToken(): Promise<string | null> {
    // Check if we have a valid token
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const authHeader = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    
    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        'grant_type': 'account_credentials',
        'account_id': this.accountId
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get Zoom access token');
    }

    const data: ZoomTokenResponse = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000);
    return this.accessToken;
  }

  async createMeeting(meetingData: CreateZoomMeetingRequest): Promise<ZoomMeetingResponse> {
    const token = await this.getAccessToken();
    
    const response = await fetch(`${this.baseUrl}/users/me/meetings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...meetingData,
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: false,
          mute_upon_entry: true,
          waiting_room: true,
          meeting_authentication: false,
          ...meetingData.settings
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create Zoom meeting: ${error.message}`);
    }

    return response.json();
  }

  async updateMeeting(meetingId: string, meetingData: Partial<CreateZoomMeetingRequest>): Promise<ZoomMeetingResponse> {
    const token = await this.getAccessToken();

    const response = await fetch(`${this.baseUrl}/meetings/${meetingId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(meetingData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to update Zoom meeting: ${error.message}`);
    }

    return response.json();
  }

  async getMeeting(meetingId: string): Promise<ZoomMeetingResponse> {
    const token = await this.getAccessToken();

    const response = await fetch(`${this.baseUrl}/meetings/${meetingId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to get Zoom meeting: ${error.message}`);
    }

    return response.json();
  }

  async deleteMeeting(meetingId: string): Promise<void> {
    const token = await this.getAccessToken();

    const response = await fetch(`${this.baseUrl}/meetings/${meetingId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to delete Zoom meeting: ${error.message}`);
    }
  }
}

export const zoomService = new ZoomService();