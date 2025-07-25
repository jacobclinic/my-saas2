import { SupabaseClient } from '@supabase/supabase-js';
import { Database, Tables } from '~/database.types';

export type Client = SupabaseClient<Database>;
export type ShortLink = Tables<'short_links'>;