import { CreateZoomMeetingRequest, ZoomMeetingResponse, ZoomTokenResponse } from './types/zoom.types';

class ZoomService {
  private zoomClientId: string;
  private zoomClientSecret: string;
  private zoomAccountId: string;
  private baseUrl: string = 'https://api.zoom.us/v2';
  private tokenUrl: string = 'https://zoom.us/oauth/token';

  constructor() {
    this.zoomClientId = process.env.ZOOM_CLIENT_ID || '';
    this.zoomClientSecret = process.env.ZOOM_CLIENT_SECRET || '';
    this.zoomAccountId = process.env.ZOOM_ACCOUNT_ID || '';
  }

  private async getAccessToken(): Promise<string | null> {
    try {
      // Check if we have a valid token
      const authHeader = Buffer.from(`${this.zoomClientId}:${this.zoomClientSecret}`).toString('base64');
      
      const response = await fetch(this.tokenUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          'grant_type': 'account_credentials',
          'account_id': this.zoomAccountId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get Zoom access token');
      }

      const data: ZoomTokenResponse = await response.json();
      return data.access_token;
    } catch (error: any) {
      console.error("Error fetching Zoom access token:", error);
      throw new Error("Failed to get Zoom access token");
    }
  }

  public async createMeeting(meetingData: CreateZoomMeetingRequest, tuturZoomId: string): Promise<ZoomMeetingResponse> {
    // Get access token
    const access_token = await this.getAccessToken();

    if (!access_token) {
      throw new Error(`Failed to create Zoom meeting: Does not have access token`);
    }

    // Meeting details
    const _meetingData = {
        ...meetingData,
        type: 2, // Scheduled meeting
        timezone: "UTC",
        settings: {
            host_video: true,
            participant_video: true,
            join_before_host: true,
            approval_type: 1, // 1 = Manually approve registrants (Zoom auto-sends unique links)
            registration_type: 2, // Each registrant gets a unique link
            waiting_room: false,
            mute_upon_entry: true
        },
    };
    
    // TODO: Need to replace "me" with write tutorZoomId
    const response = await fetch(`${this.baseUrl}/users/me/meetings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(_meetingData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create Zoom meeting: ${error.message}`);
    }

    return response.json();
  }

  public async updateMeeting(meetingId: string, meetingData: Partial<CreateZoomMeetingRequest>): Promise<ZoomMeetingResponse> {
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

  public async getMeeting(meetingId: string): Promise<ZoomMeetingResponse> {
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

  public async deleteMeeting(meetingId: string): Promise<void> {
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

  public async joinMeetingAsStudent(meetingId: string, studentData: {first_name: string, last_name: string, email: string}) {
      // Get access token
      const access_token = await this.getAccessToken();

      if (!access_token) {
        throw new Error(`Failed to create Zoom meeting: Does not have access token`);
      }

      const registrant = await this.registerStudent(meetingId, studentData);
      // Step 3: Retrieve the registrant's join URL
      const registrantListResponse = await fetch(`${this.baseUrl}/meetings/${meetingId}/registrants`, {
          method: 'GET',
          headers: {
              Authorization: `Bearer ${access_token}`,
              "Content-Type": "application/json",
          },
      });

      if (!registrantListResponse.ok) {
          const error = await registrantListResponse.json();
          throw new Error(`Failed to retrieve registrant list: ${error.message}`);
      }

      const registrantList = await registrantListResponse.json();
      const approvedRegistrant = registrantList.registrants.find((r: any) => r.id === registrant.registrant_id);

      if (!approvedRegistrant) {
          throw new Error("Approved registrant not found in registrant list.");
      }
      return {start_url: approvedRegistrant.join_url};
    
  }

  public async joinMeetingAsHost(meetingId: string) {
    // Get access token
    const access_token = await this.getAccessToken();

    if (!access_token) {
      throw new Error(`Failed to create Zoom meeting: Does not have access token`);
    }

    const response = await this.getMeeting(meetingId);
    return {start_url: response.start_url};
  }

  private async registerStudent(meetingId: string, studentData: { first_name: string; last_name: string; email: string }): Promise<any> {
    const accessToken = await this.getAccessToken();

    const response = await fetch(`${this.baseUrl}/meetings/${meetingId}/registrants`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(studentData),
    });

    if (!response.ok) throw new Error("Could not register student for meeting");

    const data = await response.json();
    await this.approveRegistrant(meetingId, data.registrant_id);

    return data;
  }

  private async approveRegistrant(meetingId: string, registrantId: string): Promise<void> {
    const accessToken = await this.getAccessToken();

    await fetch(`${this.baseUrl}/meetings/${meetingId}/registrants/status`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "approve",
        registrants: [{ id: registrantId }],
      }),
    });

    console.log(`Approved registrant: ${registrantId}`);
  }
}

export const zoomService = new ZoomService();