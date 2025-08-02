import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "~/database.types";
import { Client } from "~/lib/types/common";
import { SESSIONS_TABLE } from "~/lib/db-tables";
import SessionType from "../types/session";
import getLogger from "~/core/logger";

const logger = getLogger();

/**
 * @description Creates a new session
 * @param client - Supabase client instance
 * @param data - Session data (excluding the ID)
 */
export async function createSession(
  client: Client,
  data: Omit<SessionType, "id">
) {
  try {
    const { data: insertedSession, error } = await client
      .from(SESSIONS_TABLE)
      .insert({
        start_time: data.startTime,
        class_id: data.classId,
        title: data?.title,
        description: data?.description,
      })
      .select("id")
      .throwOnError()
      .single();

    if (error) throw error; // Manually throw error if any

    return insertedSession;
  } catch (error) {
    console.error("Error creating session:", error);
    throw new Error("Failed to create session. Please try again.");
  }
}

/**
 * @description Creates multiple sessions
 * @param client - Supabase client instance
 * @param sessions - Array of session data (excluding the ID)
 */
export async function createSessions(
  client: Client,
  sessions: Omit<SessionType, "id">[]
) {
  try {
    const { data: insertedSessions, error } = await client
      .from(SESSIONS_TABLE)
      .insert(
        sessions.map((session) => ({
          start_time: session.startTime,
          class_id: session.classId,
          title: session?.title,
          description: session?.description,
        }))
      )
      .select("id") // Select the IDs of the inserted rows
      .throwOnError();

    if (error) throw error; // Manually throw error if any

    return insertedSessions;
  } catch (error) {
    console.error("Error creating sessions:", error);
    throw new Error("Failed to create sessions. Please try again.");
  }
}

/**
 * @description Updates an existing session by ID
 * @param client - Supabase client instance
 * @param sessionId - ID of the session to update
 * @param data - Session data to update (can be partial)
 */
export async function updateSession(
  client: Client,
  sessionId: string,
  data: Partial<Omit<SessionType, "id">>
) {
  try {
    const { data: updatedSession, error } = await client
      .from(SESSIONS_TABLE)
      .update(data)
      .eq("id", sessionId)
      .select("id") // Return the session ID after the update
      .throwOnError()
      .single();

    if (error) throw error; // Manually throw error if any

    return updatedSession;
  } catch (error) {
    console.error("Error updating session:", error);
    throw new Error(
      "Failed to update session. Please check the input fields and try again."
    );
  }
}

/**
 * @description Updates all occurrences of a session by class ID
 * @param client - Supabase client instance
 * @param classId - ID of the class to update
 * @param data - Session data to update (can be partial)
 */
export async function updateAllOccurrences(
  client: Client,
  classId: string,
  data: Partial<Omit<SessionType, "id">>
) {
  try {
    const { data: updatedSession, error } = await client
      .from(SESSIONS_TABLE)
      .update(data)
      .eq("class_id", classId)
      .select("id") // Return the session ID after the update
      .throwOnError();

    if (error) throw error;

    return updatedSession;
  } catch (error) {
    console.error("Error updating all occurrences:", error);
    throw new Error("Failed to update all occurrences. Please try again.");
  }
}

/**
 * @description Deletes a session by ID
 * @param client - Supabase client instance
 * @param sessionId - ID of the session to delete
 */
export async function deleteSession(client: Client, sessionId: string) {
  try {
    const { error } = await client
      .from(SESSIONS_TABLE)
      .delete()
      .eq("id", sessionId) // Filter by sessionId
      .throwOnError();

    if (error) throw error; // Manually throw error if any

    return { message: "Session deleted successfully" };
  } catch (error) {
    console.error("Error deleting session:", error);
    throw new Error("Failed to delete session. Please try again.");
  }
}

export async function updateRecordingUrl(
  client: Client, // Adjust type based on your `getSupabaseServerActionClient` return type
  zoomMeetingId: string,
  recordingUrl: string
) {
  try {
    // Step 1: Fetch the existing recording_urls array
    const { data: session, error: fetchError } = await client
      .from(SESSIONS_TABLE)
      .select("recording_urls")
      .eq("zoom_meeting_id", zoomMeetingId)
      .single();

    if (fetchError) {
      logger.error(
        `Error fetching session for Zoom Meeting ID ${zoomMeetingId}:`,
        fetchError
      );
      throw fetchError;
    }

    if (!session) {
      const errorMsg = `Session with Zoom Meeting ID ${zoomMeetingId} not found.`;
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    logger.info(`Fetched session for Zoom Meeting ID ${zoomMeetingId}:`, {
      recording_urls: session.recording_urls,
    });

    // Step 2: Append the new URL to the array
    const currentUrls: string[] = Array.isArray(session.recording_urls)
      ? session.recording_urls
      : [];
    const updatedUrls = [...currentUrls, recordingUrl];

    // Step 3: Update the row with the new array
    const { data, error: updateError } = await client
      .from(SESSIONS_TABLE)
      .update({ recording_urls: updatedUrls })
      .eq("zoom_meeting_id", zoomMeetingId)
      .select()
      .single();

    if (updateError) {
      logger.error(
        `Error updating recording URLs for Zoom Meeting ID ${zoomMeetingId}:`,
        updateError
      );
      throw updateError;
    }

    logger.info(
      `Successfully updated recording URLs for Zoom Meeting ID ${zoomMeetingId}:`,
      {
        updatedUrls,
      }
    );
    return data;
  } catch (error) {
    logger.error(
      `Failed to update recording URL for Zoom Meeting ID ${zoomMeetingId}:`,
      error
    );
    console.error(
      `Failed to update recording URL for Zoom Meeting ID ${zoomMeetingId}:`,
      error
    );
    throw new Error("Failed to update recording URL. Please try again.");
  }
}

export async function updateAttendanceMarked(
  client: SupabaseClient,
  sessionId: string
): Promise<any> {
  try {
    // Update the attendance_marked column to true
    const result = await client
      .from(SESSIONS_TABLE)
      .update({ attendance_marked: true })
      .eq("id", sessionId)
      .select()
      .single(); // Expect a single record

    if (result.error) {
      throw new Error(`Failed to update attendance_marked`);
    }
    return { success: true, error: null };
  } catch (error) {
    console.error("Error in updateAttendanceMarked:", {
      error: error instanceof Error ? error.message : String(error),
      sessionId,
    });
    throw new Error("Failed to update attendance_marked. Please try again.");
  }
}
