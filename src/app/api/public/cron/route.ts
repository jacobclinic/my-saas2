import { NextRequest, NextResponse } from 'next/server';
import { getAllUpcommingSessionsDataPerWeek } from '~/lib/sessions/database/queries';
import { createZoomMeeting } from '~/lib/classes/server-actions-v2';
import { createClient } from '@supabase/supabase-js'; // Import directly from supabase-js
import { SESSIONS_TABLE } from '~/lib/db-tables';

// Initialize Supabase with environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req: NextRequest) {
  console.log("testFunctionWorks");
  try {
    // Create a new Supabase client for each request
    const supabase = createClient(supabaseUrl!, supabaseKey!, {
      auth: {
        persistSession: false,
      },
    });

    // Validate request
    const authHeader = req.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Fetch all upcoming sessions for the week
    const upcomingSessions = await getAllUpcommingSessionsDataPerWeek(supabase);
    // console.log('upcomingSessions:', upcomingSessions);
    let updatedCount = 0;

    const updatePromises = upcomingSessions.map(async (session) => {
      if (!session.meeting_url) {
        try {
          // Create a Zoom meeting for this session
          const zoomMeeting = await createZoomMeeting(
            session.id,
            {
              name: session.class?.name || 'Class',
              subject: session.class?.subject || 'Subject',
              description: session.description || 'Description',
              yearGrade: '',
              monthlyFee: '',
              startDate: '',
              endDate: '',
              timeSlots: [
                {
                  day: new Date(session.start_time || '').toLocaleDateString(
                    'en-US',
                    { weekday: 'long' },
                  ),
                  startTime: session.start_time || '',
                  endTime: session.end_time || '',
                },
              ],
              tutorId: '',
            },
            {
              startTime: session.start_time
                ? new Date(session.start_time)
                : new Date(),
              endTime: session.end_time ? new Date(session.end_time) : new Date(),
            },
          );
    
          if (zoomMeeting) {
            // Update the session with the Zoom meeting URL in the database
            const { error: updateError } = await supabase
              .from(SESSIONS_TABLE)
              .update({ meeting_url: zoomMeeting.zoomMeeting.join_url , zoom_meeting_id: zoomMeeting.zoomMeeting.id})
              .eq('id', session.id);
    
            if (updateError) {
              console.error(
                `Failed to update session ${session.id}: ${updateError.message}`,
              );
              return { success: false, sessionId: session.id, error: updateError };
            }
    
            return { success: true, sessionId: session.id };
          }
        } catch (error) {
          console.error(`Error processing session ${session.id}:`, error);
          return { 
            success: false, 
            sessionId: session.id, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          };
        }
      }
      return { success: false, sessionId: session.id, skipped: true };
    });
    
    // Wait for all promises to complete
    const results = await Promise.all(updatePromises);
    
    // Calculate successful updates
    const successfulUpdates = results.filter(result => result.success).length;
    const failedUpdates = results.filter(result => !result.success && !result.skipped);
    const skippedSessions = results.filter(result => result.skipped);
    
    // console.log(`Processed ${results.length} sessions:`);
    // console.log(`- Successfully updated: ${successfulUpdates}`);
    // console.log(`- Failed updates: ${failedUpdates.length}`);
    // console.log(`- Skipped (already had meeting URLs): ${skippedSessions.length}`);
    
    if (failedUpdates.length > 0) {
      console.error('Failed sessions:', failedUpdates);
    }
    
    updatedCount = successfulUpdates;

    return NextResponse.json({
      success: true,
      message: `Created Zoom meetings for ${updatedCount} sessions`,
    });
  } catch (error) {
    console.error('Error creating Zoom meetings:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create Zoom meetings' },
      { status: 500 },
    );
  }
}