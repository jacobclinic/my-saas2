import {
  CreateZoomMeetingRequest,
  ZoomMeetingResponse,
  ZoomTokenResponse,
} from './types/zoom.types';

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
      const authHeader = Buffer.from(
        `${this.zoomClientId}:${this.zoomClientSecret}`,
      ).toString('base64');

      const response = await fetch(this.tokenUrl, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'account_credentials',
          account_id: this.zoomAccountId,
          // Add scope request for meeting update permissions
          scope: 'meeting:write meeting:update meeting:read',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Zoom token fetch failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        throw new Error(
          `Failed to get Zoom access token: ${response.statusText}`,
        );
      }

      const data: ZoomTokenResponse = await response.json();
      return data.access_token;
    } catch (error: any) {
      console.error('Error fetching Zoom access token:', error);
      throw new Error(
        `Failed to get Zoom access token: ${error.message || 'Unknown error'}`,
      );
    }
  }

  public async createMeeting(
    meetingData: CreateZoomMeetingRequest,
    tuturZoomId: string,
  ): Promise<ZoomMeetingResponse> {
    try {
      // Get access token
      const access_token = await this.getAccessToken();

      if (!access_token) {
        throw new Error(
          `Failed to create Zoom meeting: Does not have access token`,
        );
      }

      // Meeting details
      const _meetingData = {
        ...meetingData,
        type: 2, // Scheduled meeting
        timezone: 'UTC', // Always use UTC for consistency
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: true,
          approval_type: 1, // 1 = Manually approve registrants (Zoom auto-sends unique links)
          registration_type: 2, // Each registrant gets a unique link
          waiting_room: false,
          mute_upon_entry: true,
        },
      };

      // TODO: Need to replace "me" with write tutorZoomId
      const response = await fetch(`${this.baseUrl}/users/me/meetings`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(_meetingData),
      });

      if (!response.ok) {
        const responseText = await response.text();
        
        let errorMessage = response.statusText;
        if (responseText) {
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.message || errorMessage;
          } catch (parseError) {
            errorMessage = responseText || errorMessage;
          }
        }
        
        throw new Error(`Failed to create Zoom meeting: ${errorMessage}`);
      }

      // Safely handle the response
      const responseText = await response.text();
      
      if (!responseText || responseText.trim() === '') {
        throw new Error('Zoom API returned an empty response when creating meeting');
      }
      
      try {
        return JSON.parse(responseText) as ZoomMeetingResponse;
      } catch (parseError) {
        console.error('Error parsing Zoom create response:', parseError);
        throw new Error('Failed to parse Zoom API response when creating meeting');
      }
    } catch (error: any) {
      console.error('Error creating Zoom meeting:', error);
      throw error;
    }
  }

  public async updateMeeting(
    meetingId: string,
    meetingData: Partial<CreateZoomMeetingRequest>,
  ): Promise<ZoomMeetingResponse> {
    try {
      const token = await this.getAccessToken();

      if (!token) {
        throw new Error('Could not obtain valid access token');
      }

      const response = await fetch(`${this.baseUrl}/meetings/${meetingId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(meetingData),
      });

      if (!response.ok) {
        // First check if there's content in the response
        const responseText = await response.text();
        
        let errorMessage = response.statusText;
        if (responseText) {
          try {
            // Try to parse as JSON if there's content
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.message || errorMessage;
          } catch (parseError) {
            // If parsing fails, use the raw text
            errorMessage = responseText || errorMessage;
          }
        }
        
        throw new Error(`Failed to update Zoom meeting: ${errorMessage}`);
      }
      
      // Safely parse the response to handle empty responses
      const responseText = await response.text();
      
      if (!responseText || responseText.trim() === '') {
        // Some APIs return empty responses on success for PATCH operations
        return { id: meetingId } as ZoomMeetingResponse;
      }
      
      try {
        return JSON.parse(responseText) as ZoomMeetingResponse;
      } catch (parseError) {
        console.error('Error parsing Zoom response:', parseError);
        // Return minimal valid response if parsing fails but request succeeded
        return { id: meetingId } as ZoomMeetingResponse;
      }
    } catch (error: any) {
      console.error('Error updating Zoom meeting:', error);
      throw error;
    }
  }

  public async getMeeting(meetingId: string): Promise<ZoomMeetingResponse> {
    try {
      const token = await this.getAccessToken();

      if (!token) {
        throw new Error('Could not obtain valid access token');
      }

      const response = await fetch(`${this.baseUrl}/meetings/${meetingId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // Handle error response
        const responseText = await response.text();

        let errorMessage = response.statusText;
        if (responseText) {
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.message || errorMessage;
          } catch (parseError) {
            errorMessage = responseText || errorMessage;
          }
        }

        throw new Error(`Failed to get Zoom meeting: ${errorMessage}`);
      }

      // Safely handle the response
      const responseText = await response.text();
      
      if (!responseText || responseText.trim() === '') {
        throw new Error(
          `Zoom API returned an empty response for meeting ${meetingId}`,
        );
      }

      try {
        return JSON.parse(responseText) as ZoomMeetingResponse;
      } catch (parseError) {
        console.error('Error parsing Zoom get response:', parseError);
        throw new Error('Failed to parse Zoom API response');
      }
    } catch (error: any) {
      console.error('Error getting Zoom meeting:', error);
      throw error;
    }
  }

  public async deleteMeeting(meetingId: string): Promise<void> {
    try {
      const token = await this.getAccessToken();

      if (!token) {
        throw new Error('Could not obtain valid access token');
      }

      const response = await fetch(`${this.baseUrl}/meetings/${meetingId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const responseText = await response.text();

        let errorMessage = response.statusText;
        if (responseText) {
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.message || errorMessage;
          } catch (parseError) {
            errorMessage = responseText || errorMessage;
          }
        }

        throw new Error(`Failed to delete Zoom meeting: ${errorMessage}`);
      }

      // No need to return anything for delete operations
    } catch (error: any) {
      console.error('Error deleting Zoom meeting:', error);
      throw error;
    }
  }

  public async joinMeetingAsStudent(
    meetingId: string,
    studentData: { first_name: string; last_name: string; email: string },
  ) {
    try {
      // Get access token
      const access_token = await this.getAccessToken();

      if (!access_token) {
        throw new Error(
          `Failed to join Zoom meeting: Does not have access token`,
        );
      }

      const registrant = await this.registerStudent(meetingId, studentData);

      // Step 3: Retrieve the registrant's join URL
      const registrantListResponse = await fetch(
        `${this.baseUrl}/meetings/${meetingId}/registrants`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${access_token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!registrantListResponse.ok) {
        const responseText = await registrantListResponse.text();

        let errorMessage = registrantListResponse.statusText;
        if (responseText) {
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.message || errorMessage;
          } catch (parseError) {
            errorMessage = responseText || errorMessage;
          }
        }

        throw new Error(`Failed to retrieve registrant list: ${errorMessage}`);
      }

      // Safely handle the response
      const responseText = await registrantListResponse.text();

      if (!responseText || responseText.trim() === '') {
        throw new Error('Zoom API returned an empty registrant list');
      }

      let registrantList;
      try {
        registrantList = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parsing Zoom registrant list:', parseError);
        throw new Error('Failed to parse Zoom API registrant list');
      }

      const approvedRegistrant = registrantList.registrants?.find(
        (r: any) => r.id === registrant.registrant_id,
      );

      if (!approvedRegistrant) {
        throw new Error('Approved registrant not found in registrant list.');
      }

      return { start_url: approvedRegistrant.join_url };
    } catch (error: any) {
      console.error('Error joining meeting as student:', error);
      throw error;
    }
  }

  public async joinMeetingAsHost(meetingId: string) {
    // Get access token
    const access_token = await this.getAccessToken();

    if (!access_token) {
      throw new Error(
        `Failed to create Zoom meeting: Does not have access token`,
      );
    }

    const response = await this.getMeeting(meetingId);
    return { start_url: response.start_url };
  }

  private async registerStudent(
    meetingId: string,
    studentData: { first_name: string; last_name: string; email: string },
  ): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();

      if (!accessToken) {
        throw new Error('Could not obtain valid access token');
      }

      const response = await fetch(
        `${this.baseUrl}/meetings/${meetingId}/registrants`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(studentData),
        },
      );

      if (!response.ok) {
        const responseText = await response.text();

        let errorMessage = response.statusText;
        if (responseText) {
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.message || errorMessage;
          } catch (parseError) {
            errorMessage = responseText || errorMessage;
          }
        }

        throw new Error(
          `Could not register student for meeting: ${errorMessage}`,
        );
      }

      // Safely handle the response
      const responseText = await response.text();

      if (!responseText || responseText.trim() === '') {
        throw new Error(
          'Zoom API returned an empty response when registering student',
        );
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parsing Zoom register response:', parseError);
        throw new Error(
          'Failed to parse Zoom API response when registering student',
        );
      }

      if (data && data.registrant_id) {
        await this.approveRegistrant(meetingId, data.registrant_id);
        return data;
      } else {
        throw new Error('Invalid registrant data received from Zoom API');
      }
    } catch (error: any) {
      console.error('Error registering student for meeting:', error);
      throw error;
    }
  }

  private async approveRegistrant(
    meetingId: string,
    registrantId: string,
  ): Promise<void> {
    const accessToken = await this.getAccessToken();

    await fetch(`${this.baseUrl}/meetings/${meetingId}/registrants/status`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'approve',
        registrants: [{ id: registrantId }],
      }),
    });
  }
}

export const zoomService = new ZoomService();
