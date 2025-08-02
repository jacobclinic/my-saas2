import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "~/database.types";

/**
 * Common Supabase client type used across the application
 */
export type Client = SupabaseClient<Database>;

/**
 * Common time range interface for date/time operations
 */
export interface TimeRange {
  startTime: string; // e.g., "2025-05-03T06:13:00Z"
  endTime: string; // e.g., "2025-05-03T06:22:00Z"
}
