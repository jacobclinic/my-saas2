import { ZOOM_USERS_TABLE } from '~/lib/db-tables';
import { Client } from '../types';

export async function getZoomUserByTutorId(client: Client, tutorId: string) {

    const { data, error } = await client
        .from(ZOOM_USERS_TABLE)
        .select('*')
        .eq('tutor_id', tutorId)
        .single();

    if (error) throw error;
    return data;
}