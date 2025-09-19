export interface ZoomSessionResult {
  sessionId: string;
  status: 'success' | 'failed' | 'skipped' | 'queued' | 'updated';
  reason?: string;
  meetingId?: string;
  error?: string;
  queueMessageId?: string;
}