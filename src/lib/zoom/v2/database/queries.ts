import { ZOOM_USERS_TABLE } from '~/lib/db-tables';
import { Client } from '../types';

export async function getZoomUserByTutorId(client: Client, tutorId: string) {
    return await client
        .from(ZOOM_USERS_TABLE)
        .select('*')
        .eq('tutor_id', tutorId)
        .maybeSingle();
}