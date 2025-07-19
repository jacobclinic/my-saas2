import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '~/database.types';
import getLogger from '~/core/logger';
import { ZOOM_USERS_TABLE } from '~/lib/db-tables';

type Client = SupabaseClient<Database>;

const logger = getLogger();

type CreateZoomUserPayload = ZoomUser & {
    tutor_id: string;
}

export async function createZoomUser(client: Client, data: CreateZoomUserPayload) {
    try {
        const payload = {
            created_at: new Date().toISOString(),
            zoom_user_id: data.id,
            account_type: data.type,
            tutor_id: data.tutor_id,
            email: data.email,
        }
        const { data: insertedZoomUser, error } = await client
            .from(ZOOM_USERS_TABLE)
            .insert(payload)
            .select('id')
            .throwOnError()
            .single();

        if (error) throw error;

        return insertedZoomUser;

    } catch (error) {
        logger.error('Error creating zoom user:', error);
        throw new Error('Failed to create zoom user. Please try again.');
    }
}

