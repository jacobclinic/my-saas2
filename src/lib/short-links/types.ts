import { SupabaseClient } from '@supabase/supabase-js';
import { Database, Tables } from '~/database.types';
import { Client } from '~/lib/types/common';

export type { Client };
export type ShortLink = Tables<'short_links'>;