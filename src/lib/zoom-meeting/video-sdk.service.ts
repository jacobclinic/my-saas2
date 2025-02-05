// lib/zoom/video-sdk.service.ts

import ZoomVideo from '@zoom/videosdk';
import { KJUR } from 'jsrsasign';

interface ZoomSessionConfig {
  sessionName: string;
  startTime: string;
  duration: number;
  tutorId: string;
  className: string;
}

export class ZoomVideoService {
  private readonly sdkKey: string;
  private readonly sdkSecret: string;

  constructor() {
    this.sdkKey = process.env.ZOOM_SDK_KEY || '';
    this.sdkSecret = process.env.ZOOM_SDK_SECRET || '';
  }

  private generateToken(config: ZoomSessionConfig, isHost: boolean = true): string {
    const iat = Math.round(new Date().getTime() / 1000) - 30;
    const startTime = Math.round(new Date(config?.startTime).getTime() / 1000);
    const exp = startTime + (config.duration * 60); // Convert duration to seconds

    const oHeader = { alg: 'HS256', typ: 'JWT' };
    const oPayload = {
      app_key: this.sdkKey,
      tpc: config.sessionName,
      role_type: isHost ? 1 : 0, // 1 for host (tutor), 0 for participant (student)
      version: 1,
      iat: iat,
      exp: exp
    };

    const sHeader = JSON.stringify(oHeader);
    const sPayload = JSON.stringify(oPayload);
    const signature = KJUR.jws.JWS.sign('HS256', sHeader, sPayload, this.sdkSecret);

    return signature;
  }

  async initializeSession(config: ZoomSessionConfig) {
    try {
      // Generate unique session name combining class and timestamp
      const sessionName = `${config.className}_${config.startTime}`;
      
      // Generate tokens for both tutor and students
      const hostToken = this.generateToken({
        ...config,
        sessionName
      }, true);

      const participantToken = this.generateToken({
        ...config,
        sessionName
      }, false);

      return {
        success: true,
        sessionName,
        hostToken,
        participantToken
      };
    } catch (error) {
      console.error('Failed to initialize Zoom session:', error);
      return {
        success: false,
        error: 'Failed to initialize Zoom session'
      };
    }
  }
}

export const zoomVideoService = new ZoomVideoService();