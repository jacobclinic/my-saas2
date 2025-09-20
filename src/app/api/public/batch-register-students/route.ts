import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import getLogger from '~/core/logger';
import { zoomService } from '~/lib/zoom/zoom.service';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const logger = getLogger();

interface QStashBatchRegistrationPayload {
  sessionId: string;
  meetingId: string;
  sessionTitle: string;
  students: Array<{
    first_name: string;
    last_name: string;
    email: string;
  }>;
  requestedAt: string;
  jobId?: string;
}

/**
 * QStash background job handler for batch registering students for a single session
 * This processes one session at a time to enable parallelization and isolated failures
 */
export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseKey) {
      logger.error('Supabase URL or Key is not defined in batch registration job');
      return NextResponse.json({
        success: false,
        error: 'Server configuration error'
      }, { status: 500 });
    }

    const payload: QStashBatchRegistrationPayload = await request.json();

    logger.info('Processing QStash batch registration job', {
      sessionId: payload.sessionId,
      meetingId: payload.meetingId,
      sessionTitle: payload.sessionTitle,
      studentCount: payload.students.length,
      jobId: payload.jobId || 'unknown'
    });

    if (!payload.meetingId) {
      logger.warn('Session has no Zoom meeting ID, skipping registration', {
        sessionId: payload.sessionId,
        sessionTitle: payload.sessionTitle
      });
      return NextResponse.json({
        success: true,
        sessionId: payload.sessionId,
        skipped: true,
        reason: 'No Zoom meeting ID',
        registeredCount: 0,
        skippedCount: payload.students.length,
        failedCount: 0
      });
    }

    if (payload.students.length === 0) {
      logger.info('No students to register for session', {
        sessionId: payload.sessionId,
        sessionTitle: payload.sessionTitle
      });
      return NextResponse.json({
        success: true,
        sessionId: payload.sessionId,
        registeredCount: 0,
        skippedCount: 0,
        failedCount: 0,
        summary: 'No students to register'
      });
    }

    // Process batch registration
    logger.info(`Starting batch registration for ${payload.students.length} students in session: ${payload.sessionTitle}`);

    const startTime = Date.now();
    const registrationResult = await zoomService.batchRegisterAllStudents(
      payload.meetingId,
      payload.students
    );
    const processingTime = Date.now() - startTime;

    logger.info('QStash batch registration completed', {
      sessionId: payload.sessionId,
      sessionTitle: payload.sessionTitle,
      processingTimeMs: processingTime,
      summary: registrationResult.summary,
      registeredCount: registrationResult.registeredCount,
      skippedCount: registrationResult.skippedCount,
      failedCount: registrationResult.failedCount,
      errorsCount: registrationResult.errors.length
    });

    // Return detailed results for monitoring
    return NextResponse.json({
      success: registrationResult.success,
      sessionId: payload.sessionId,
      sessionTitle: payload.sessionTitle,
      registeredCount: registrationResult.registeredCount,
      skippedCount: registrationResult.skippedCount,
      failedCount: registrationResult.failedCount,
      totalStudents: registrationResult.totalStudents,
      summary: registrationResult.summary,
      errors: registrationResult.errors,
      processingTimeMs: processingTime,
      completedAt: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error in QStash batch registration job', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export const maxDuration = 300; // 5 minutes for heavy batch operations