import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '~/database.types';
import { ZOOM_CUSTOMER_KEY_MAPPING_TABLE, USERS_TABLE } from '~/lib/db-tables';
import { DatabaseError } from '~/lib/shared/errors';
import { failure, Result, success } from '~/lib/shared/result';
import getLogger from '~/core/logger';
import { SessionUserMapping } from '../types';

const logger = getLogger();


export async function getSessionAndUserByCustomerKey(
    client: SupabaseClient<Database>,
    customerKey: string,
): Promise<Result<SessionUserMapping, DatabaseError>> {
    try {
        if (!customerKey || typeof customerKey !== 'string' || customerKey.trim() === '') {
            logger.error('Invalid customerKey provided', { customerKey });
            return failure(new DatabaseError('Invalid or missing customerKey'));
        }

        const { data, error } = await client
            .from(ZOOM_CUSTOMER_KEY_MAPPING_TABLE)
            .select(`
        session_id,
        user_id,
        users!zoom_customer_key_mapping_user_id_fkey(email)
      `)
            .eq('customer_key', customerKey)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                logger.info('Customer key not found in mapping table', { customerKey });
                return failure(new DatabaseError('Customer key not found'));
            }
            logger.error('Error querying session and user by customer key', {
                error: error.message,
                customerKey,
            });
            return failure(new DatabaseError('Error querying session and user data'));
        }

        if (!data) {
            logger.error('No data returned from customer key lookup', { customerKey });
            return failure(new DatabaseError('No data found for customer key'));
        }

        const result: SessionUserMapping = {
            session_id: data.session_id,
            user_id: data.user_id,
            user_email: (data.users as any)?.email || null,
        };

        logger.info('Successfully found session and user by customer key', {
            customerKey,
            sessionId: result.session_id,
            userId: result.user_id,
            hasEmail: !!result.user_email,
        });

        return success(result);
    } catch (error) {
        logger.error('Error in getSessionAndUserByCustomerKey', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            name: error instanceof Error ? error.name : undefined,
            customerKey,
        });
    return failure(new DatabaseError('Failed to lookup session and user by customer key'));
  }
}
