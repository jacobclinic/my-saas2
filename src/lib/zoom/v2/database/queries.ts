import { ZOOM_USERS_TABLE } from '~/lib/db-tables';
import { Client, CommaZoomUser, DBZoomUser } from '../types';
import { failure, Result, success } from '~/lib/shared/result';
import { DatabaseError } from '~/lib/shared/errors';

export async function getZoomUserByTutorId(client: Client, tutorId: string) {
    return await client
        .from(ZOOM_USERS_TABLE)
        .select('*')
        .eq('tutor_id', tutorId)
        .maybeSingle();
}

export async function getZoomUserByEmail(client: Client, email: string) {
    const { data, error } = await client
        .from(ZOOM_USERS_TABLE)
        .select('*')
        .eq('email', email)
        .maybeSingle();

    if (error) {
        throw new Error(`Failed to fetch zoom user by email: ${error.message}`);
    }
    return data;
}

export async function getAllZoomUsers(client: Client) {
    const { data, error } = await client
        .from(ZOOM_USERS_TABLE)
        .select('*');
    if (error) {
        throw new Error(`Failed to fetch zoom users: ${error.message}`);
    }
    return data;
}

export async function getAllUnassignedZoomUsers(client: Client) {
    const { data, error } = await client
        .from(ZOOM_USERS_TABLE)
        .select('*')
        .eq('is_assigned', false);
    if (error) {
        throw new Error(`Failed to fetch unassigned zoom users: ${error.message}`);
    }
    return data;
}

export async function getAllZoomUsersWithTutor(client: Client) {
    const { data, error } = await client
        .from(ZOOM_USERS_TABLE)
        .select(`
            *,
            users!zoom_users_tutor_id_fkey(
                id,
                first_name,
                last_name,
                email,
                display_name
            )
        `);
    if (error) {
        throw new Error(`Failed to fetch zoom users: ${error.message}`);
    }
    return data;
}

export async function getUnassignedZoomUsers(client: Client): Promise<Result<DBZoomUser[]>> {
    try {
        const { data, error } = await client
            .from(ZOOM_USERS_TABLE)
            .select('*')
            .eq('is_assigned', false);
        if (error) {
            return failure(
                new DatabaseError(
                    `Failed to fetch unassigned zoom users: ${error.message}`,
                ),
            );
        }
        const users = data as DBZoomUser[];
        return success(users);
    } catch (error) {
        return failure(
            new DatabaseError(`Failed to fetch unassigned zoom users: ${error}`),
        );
    }
}

export async function getZoomUserById(client: Client, zoomUserId: number): Promise<Result<DBZoomUser>> {
    try {
        const { data, error } = await client
            .from(ZOOM_USERS_TABLE)
            .select('*')
            .eq('id', zoomUserId)
            .maybeSingle();
        if (error) {
            return failure(new DatabaseError(`Failed to fetch zoom user by zoom user id: ${error.message}`));
        }
        return success(data as DBZoomUser);
    } catch (error) {
        return failure(new DatabaseError(`Failed to fetch zoom user by zoom user id: ${error}`));
    }
}