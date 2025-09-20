import {
  CreateZoomMeetingRequest,
  ZoomMeetingResponse,
  ZoomTokenResponse,
} from './types/zoom.types';
import getLogger from '~/core/logger';

const logger = getLogger();

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
          registrants_confirmation_email: false,
          registrants_email_notification: false,
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
      logger.info(`Student attempting to join meeting ${meetingId}`, {
        email: studentData.email,
        meetingId
      });

      // Note: Cache checking is handled in student-session.service.ts
      // This method is only called when no cache exists

      // Step 1: Register student using individual registration API
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
          body: JSON.stringify({
            email: studentData.email,
            first_name: studentData.first_name,
            last_name: studentData.last_name,
            auto_approve: true
          }),
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

        throw new Error(`Registration failed: ${errorMessage}`);
      }

      const result = await response.json();

      logger.info(`Student successfully registered for meeting ${meetingId}`, {
        email: studentData.email,
        registrantId: result.registrant_id
      });

      return {
        join_url: result.join_url,
        start_url: result.join_url,
        registrant_id: result.registrant_id,
        success: true
      };

    } catch (error: any) {
      logger.error('Error in joinMeetingAsStudent:', {
        error: error.message,
        meetingId,
        studentEmail: studentData.email
      });
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

  /**
   * Batch register multiple students for a meeting (up to 30 at once)
   * Uses Zoom's batch registration API to avoid individual registration limits
   */
  public async batchRegisterStudents(
    meetingId: string,
    students: Array<{
      first_name: string;
      last_name: string;
      email: string;
    }>
  ): Promise<{
    success: boolean;
    registrants?: Array<{
      email: string;
      join_url: string;
      registrant_id: string;
    }>;
    error?: string;
  }> {
    try {
      if (students.length === 0) {
        return { success: true, registrants: [] };
      }

      if (students.length > 30) {
        throw new Error('Cannot batch register more than 30 students at once. Use batchRegisterAllStudents for larger groups.');
      }

      const accessToken = await this.getAccessToken();
      if (!accessToken) {
        throw new Error('Could not obtain valid access token');
      }

      const response = await fetch(
        `${this.baseUrl}/meetings/${meetingId}/batch_registrants`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            auto_approve: true, // Automatically approve all registrants
            registrants: students
          }),
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

        throw new Error(`Batch registration failed: ${errorMessage}`);
      }

      const result = await response.json();

      if (!result.registrants || !Array.isArray(result.registrants)) {
        throw new Error('Invalid batch registration response from Zoom API');
      }

      logger.info(`Successfully batch registered ${result.registrants.length} students for meeting ${meetingId}`);

      return {
        success: true,
        registrants: result.registrants
      };

    } catch (error: any) {
      logger.error('Error in batch registration:', {
        error: error.message,
        meetingId,
        studentCount: students.length
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Comprehensive batch registration for any number of students
   * Handles large classes (>30 students) with chunking, deduplication, and partial failure recovery
   */
  public async batchRegisterAllStudents(
    meetingId: string,
    students: Array<{
      first_name: string;
      last_name: string;
      email: string;
    }>
  ): Promise<{
    success: boolean;
    totalStudents: number;
    registeredCount: number;
    skippedCount: number;
    failedCount: number;
    registrants: Array<{
      email: string;
      join_url: string;
      registrant_id: string;
    }>;
    errors: string[];
    summary: string;
  }> {
    const BATCH_SIZE = 30;
    const RATE_LIMIT_DELAY = 1000; // 1 second between batches

    try {
      logger.info(`Starting comprehensive batch registration for ${students.length} students in meeting ${meetingId}`);

      // Step 1: Get existing registrants to avoid duplicates
      const existingResult = await this.getExistingRegistrants(meetingId);
      const existingEmails = new Set(
        existingResult.registrants?.map(r => r.email.toLowerCase()) || []
      );

      logger.info(`Found ${existingEmails.size} existing registrants for meeting ${meetingId}`);

      // Step 2: Filter out already registered students
      const unregisteredStudents = students.filter(
        student => !existingEmails.has(student.email.toLowerCase())
      );

      logger.info(`${students.length - unregisteredStudents.length} students already registered, ${unregisteredStudents.length} to register`);

      if (unregisteredStudents.length === 0) {
        return {
          success: true,
          totalStudents: students.length,
          registeredCount: 0,
          skippedCount: students.length,
          failedCount: 0,
          registrants: [],
          errors: [],
          summary: `All ${students.length} students were already registered`
        };
      }

      // Step 3: Split into batches of 30
      const batches = this.chunkArray(unregisteredStudents, BATCH_SIZE);
      logger.info(`Processing ${batches.length} batches for ${unregisteredStudents.length} unregistered students`);

      // Step 4: Process each batch
      const allRegistrants: Array<{
        email: string;
        join_url: string;
        registrant_id: string;
      }> = [];
      const errors: string[] = [];
      let successfulBatches = 0;
      let totalRegistered = 0;

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        logger.info(`Processing batch ${i + 1}/${batches.length} with ${batch.length} students`);

        try {
          const batchResult = await this.batchRegisterStudents(meetingId, batch);

          if (batchResult.success && batchResult.registrants) {
            allRegistrants.push(...batchResult.registrants);
            totalRegistered += batchResult.registrants.length;
            successfulBatches++;
            logger.info(`Batch ${i + 1} succeeded: registered ${batchResult.registrants.length} students`);
          } else {
            const error = `Batch ${i + 1} failed: ${batchResult.error || 'Unknown error'}`;
            errors.push(error);
            logger.error(error);
          }

        } catch (error) {
          const errorMsg = `Batch ${i + 1} exception: ${error instanceof Error ? error.message : String(error)}`;
          errors.push(errorMsg);
          logger.error(errorMsg);
        }

        // Rate limiting: Add delay between batches (except for the last one)
        if (i < batches.length - 1) {
          logger.info(`Waiting ${RATE_LIMIT_DELAY}ms before next batch...`);
          await this.delay(RATE_LIMIT_DELAY);
        }
      }

      // Step 5: Calculate final results
      const skippedCount = students.length - unregisteredStudents.length;
      const failedCount = unregisteredStudents.length - totalRegistered;
      const overallSuccess = errors.length === 0;

      const summary = this.generateBatchSummary({
        totalStudents: students.length,
        registeredCount: totalRegistered,
        skippedCount,
        failedCount,
        successfulBatches,
        totalBatches: batches.length
      });

      logger.info(`Batch registration completed: ${summary}`);

      return {
        success: overallSuccess,
        totalStudents: students.length,
        registeredCount: totalRegistered,
        skippedCount,
        failedCount,
        registrants: allRegistrants,
        errors,
        summary
      };

    } catch (error) {
      const errorMsg = `Comprehensive batch registration failed: ${error instanceof Error ? error.message : String(error)}`;
      logger.error(errorMsg);

      return {
        success: false,
        totalStudents: students.length,
        registeredCount: 0,
        skippedCount: 0,
        failedCount: students.length,
        registrants: [],
        errors: [errorMsg],
        summary: errorMsg
      };
    }
  }

  /**
   * Check if students are already registered for a meeting
   * Returns list of existing registrants to avoid duplicate registrations
   */
  public async getExistingRegistrants(
    meetingId: string
  ): Promise<{
    success: boolean;
    registrants?: Array<{
      email: string;
      join_url: string;
      registrant_id: string;
      status: string;
    }>;
    error?: string;
  }> {
    try {
      const accessToken = await this.getAccessToken();
      if (!accessToken) {
        throw new Error('Could not obtain valid access token');
      }

      const response = await fetch(
        `${this.baseUrl}/meetings/${meetingId}/registrants`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
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

        throw new Error(`Failed to get registrants: ${errorMessage}`);
      }

      const result = await response.json();

      return {
        success: true,
        registrants: result.registrants || []
      };

    } catch (error: any) {
      logger.error('Error getting existing registrants:', {
        error: error.message,
        meetingId
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Find a student's existing registration for a meeting
   * Returns join URL if student is already registered
   */
  public async getStudentRegistration(
    meetingId: string,
    studentEmail: string
  ): Promise<{
    success: boolean;
    isRegistered: boolean;
    joinUrl?: string;
    registrantId?: string;
    error?: string;
  }> {
    try {
      const existingResult = await this.getExistingRegistrants(meetingId);

      if (!existingResult.success) {
        return {
          success: false,
          isRegistered: false,
          error: existingResult.error
        };
      }

      const existingRegistrant = existingResult.registrants?.find(
        r => r.email.toLowerCase() === studentEmail.toLowerCase()
      );

      if (existingRegistrant) {
        return {
          success: true,
          isRegistered: true,
          joinUrl: existingRegistrant.join_url,
          registrantId: existingRegistrant.registrant_id
        };
      }

      return {
        success: true,
        isRegistered: false
      };

    } catch (error: any) {
      logger.error('Error checking student registration:', {
        error: error.message,
        meetingId,
        studentEmail
      });

      return {
        success: false,
        isRegistered: false,
        error: error.message
      };
    }
  }

  /**
   * Utility: Split array into chunks of specified size
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Utility: Add delay for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Utility: Generate human-readable summary of batch operation
   */
  private generateBatchSummary(stats: {
    totalStudents: number;
    registeredCount: number;
    skippedCount: number;
    failedCount: number;
    successfulBatches: number;
    totalBatches: number;
  }): string {
    const { totalStudents, registeredCount, skippedCount, failedCount, successfulBatches, totalBatches } = stats;

    if (failedCount === 0) {
      return `Successfully processed all ${totalStudents} students: ${registeredCount} newly registered, ${skippedCount} already registered`;
    } else {
      return `Processed ${totalStudents} students: ${registeredCount} registered, ${skippedCount} skipped, ${failedCount} failed (${successfulBatches}/${totalBatches} batches succeeded)`;
    }
  }
}

export const zoomService = new ZoomService();
