import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '~/database.types';
import getLogger from '~/core/logger';
import { ZOOM_USERS_TABLE } from '~/lib/db-tables';
import { ZoomUser } from '../types';

type Client = SupabaseClient<Database>;

const logger = getLogger();

type CreateZoomUserPayload = ZoomUser & {
    tutor_id: string;
}

export async function updateZoomUser(client: Client, recordId: number, data: CreateZoomUserPayload) {
    try {
        const payload = {
            is_assigned: true,
            zoom_user_id: data.id,
            account_type: data.type,
            tutor_id: data.tutor_id,
        }
        const { data: updatedZoomUser, error } = await client
            .from(ZOOM_USERS_TABLE)
            .update(payload)
            .eq('id', recordId)
            .select('id')
            .throwOnError()
            .single();
        if (error) throw error;
        return updatedZoomUser;
    } catch (error) {
        logger.error('Error updating zoom user:', error);
        throw new Error('Failed to update zoom user. Please try again.');
    }
}

export async function createZoomUser(client: Client, data: CreateZoomUserPayload) {
    try {
        const payload = {
            created_at: new Date().toISOString(),
            zoom_user_id: data.id,
            account_type: data.type,
            tutor_id: data.tutor_id,
            email: data.email,
            is_assigned: true,
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

export async function createUnassignedZoomUser(client: Client, email: string) {
    try {
        const payload = {
            created_at: new Date().toISOString(),
            email: email,
            zoom_user_id: '',
            account_type: 1,
            is_assigned: false,
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
        logger.error('Error creating unassigned zoom user:', error);
        throw error;
    }
}
