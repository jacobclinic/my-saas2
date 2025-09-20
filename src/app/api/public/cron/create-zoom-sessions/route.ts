import { createClient } from '@supabase/supabase-js';
import getLogger from '~/core/logger';
import { ZoomService } from '~/lib/zoom/v2/zoom.service';
import { Client } from '@upstash/qstash';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const logger = getLogger();
const qstashClient = new Client({ token: process.env.QSTASH_TOKEN! });

/**
 * Gets enrolled students for sessions happening tomorrow
 */
async function getEnrolledStudentsForSessions(supabase: any, sessionIds: string[]): Promise<any[]> {
  try {
    const { data: enrollments, error } = await supabase
      .from('student_class_enrollments')
      .select(`
        student_id,
        session:sessions!inner (
          id,
          zoom_meeting_id,
          title,
          start_time,
          class:classes (
            id,
            name
          )
        ),
        student:users (
          id,
          email,
          first_name,
          last_name
        )
      `)
      .in('session.id', sessionIds)
      .not('session.zoom_meeting_id', 'is', null);

    if (error) {
      logger.error('Error fetching enrolled students for sessions:', error);
      return [];
    }

    // Group students by session
    const sessionStudentMap = new Map<string, Array<{
      first_name: string;
      last_name: string;
      email: string;
    }>>();

    enrollments?.forEach((enrollment: any) => {
      const sessionId = enrollment.session.id;
      const student = {
        first_name: enrollment.student.first_name,
        last_name: enrollment.student.last_name,
        email: enrollment.student.email
      };

      if (!sessionStudentMap.has(sessionId)) {
        sessionStudentMap.set(sessionId, []);
      }
      sessionStudentMap.get(sessionId)!.push(student);
    });

    return Array.from(sessionStudentMap.entries()).map(([sessionId, students]) => {
      const session = enrollments.find((e: any) => e.session.id === sessionId)?.session;
      return {
        sessionId,
        meetingId: session?.zoom_meeting_id,
        sessionTitle: session?.title || session?.class?.name,
        students
      };
    });

  } catch (error) {
    logger.error('Error in getEnrolledStudentsForSessions:', error);
    return [];
  }
}

/**
 * Queue student registration jobs to QStash for parallel processing
 */
async function queueStudentRegistrationJobs(sessionStudents: Array<{
  sessionId: string;
  meetingId: string;
  sessionTitle: string;
  students: Array<{
    first_name: string;
    last_name: string;
    email: string;
  }>;
}>): Promise<{
  success: number;
  failed: number;
  totalStudents: number;
  errors: string[];
}> {
  let successCount = 0;
  let failedCount = 0;
  let totalStudents = 0;
  const errors: string[] = [];

  logger.info(`Queuing ${sessionStudents.length} student registration jobs to QStash`);

  for (const sessionData of sessionStudents) {
    const { sessionId, meetingId, sessionTitle, students } = sessionData;
    totalStudents += students.length;

    if (!meetingId) {
      logger.warn(`Session ${sessionId} has no Zoom meeting ID, skipping job queue`);
      failedCount++;
      errors.push(`Session ${sessionId}: No Zoom meeting ID`);
      continue;
    }

    if (students.length === 0) {
      logger.info(`Session ${sessionId} has no students, skipping job queue`);
      successCount++; // Not an error, just nothing to do
      continue;
    }

    try {
      // Generate unique job ID for tracking
      const jobId = `batch-reg-${sessionId}-${Date.now()}`;

      // Add random delay to stagger job execution (0-60 seconds)
      const delaySeconds = Math.floor(Math.random() * 60);

      const result = await qstashClient.publishJSON({
        url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/public/batch-register-students`,
        body: {
          sessionId,
          meetingId,
          sessionTitle: sessionTitle || 'Untitled Session',
          students,
          requestedAt: new Date().toISOString(),
          jobId
        },
        retries: 3,
        delay: delaySeconds,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      logger.info(`QStash job queued successfully`, {
        sessionId,
        sessionTitle,
        studentCount: students.length,
        jobId,
        qstashMessageId: result.messageId,
        delaySeconds
      });

      successCount++;

    } catch (error) {
      const errorMsg = `Failed to queue job for session ${sessionId}: ${error instanceof Error ? error.message : String(error)}`;
      logger.error(errorMsg);
      errors.push(errorMsg);
      failedCount++;
    }
  }

  logger.info('QStash job queuing completed', {
    totalSessions: sessionStudents.length,
    successCount,
    failedCount,
    totalStudents
  });

  return {
    success: successCount,
    failed: failedCount,
    totalStudents,
    errors
  };
}

export async function POST(req: Request) {
    try {
        if (!supabaseUrl || !supabaseKey) {
            logger.error('Supabase URL or Key is not defined');
            return new Response('Internal Server Error', { status: 500 });
        }

        // Validate request
        const authHeader = req.headers.get('Authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return new Response('Unauthorized', { status: 401 });
        }

        const supabase = createClient(supabaseUrl!, supabaseKey!, {
            auth: {
                persistSession: false,
            },
        });

        logger.info('Starting daily Zoom session creation and student registration cron job');

        // Step 1: Create Zoom meetings for tomorrow's sessions
        const zoomServiceV2 = new ZoomService(supabase);
        logger.info('Creating Zoom meetings for tomorrow sessions...');
        await zoomServiceV2.createMeetingsForTomorrowSessions();

        // Step 2: Get sessions that now have Zoom meetings
        const { data: sessionsWithMeetings, error: sessionsError } = await supabase
          .from('sessions')
          .select('id, zoom_meeting_id, title, start_time')
          .not('zoom_meeting_id', 'is', null)
          .gte('start_time', new Date().toISOString())
          .lt('start_time', new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()); // Next 2 days

        if (sessionsError) {
          logger.error('Error fetching sessions with Zoom meetings:', sessionsError);
          return new Response('Error fetching sessions', { status: 500 });
        }

        if (!sessionsWithMeetings || sessionsWithMeetings.length === 0) {
          logger.info('No sessions with Zoom meetings found for student registration');
          return new Response('Zoom sessions created successfully, no student registrations needed', { status: 200 });
        }

        // Step 3: Get enrolled students for these sessions
        const sessionIds = sessionsWithMeetings.map(s => s.id);
        const sessionStudents = await getEnrolledStudentsForSessions(supabase, sessionIds);

        if (sessionStudents.length === 0) {
          logger.info('No enrolled students found for sessions');
          return new Response('Zoom sessions created successfully, no students to register', { status: 200 });
        }

        // Step 4: Queue student registration jobs to QStash (parallel processing)
        const queuedJobs = await queueStudentRegistrationJobs(sessionStudents);

        logger.info('Student registration jobs queued to QStash', {
          totalSessions: sessionStudents.length,
          queuedJobs: queuedJobs.success,
          failedJobs: queuedJobs.failed,
          totalStudents: queuedJobs.totalStudents
        });

        // Step 5: Return success response (registration happens in background)
        const response = {
          success: true,
          message: 'Zoom sessions created and student registration jobs queued successfully',
          summary: {
            sessionsWithMeetings: sessionsWithMeetings?.length || 0,
            registrationJobsQueued: queuedJobs.success,
            failedJobsQueued: queuedJobs.failed,
            totalStudentsQueued: queuedJobs.totalStudents,
            note: 'Student registration is processing in background via QStash'
          }
        };

        return new Response(JSON.stringify(response), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        logger.error('Error in POST /api/public/create-zoom-sessions:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}