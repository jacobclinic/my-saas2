import { SHORT_LINKS_TABLE } from '~/lib/db-tables';
import { Client, ShortLink } from '../types';

export async function insertShortLink(client: Client, shortCode: string, originalUrl: string,): Promise<ShortLink> {
    const { data, error } = await client
        .from(SHORT_LINKS_TABLE)
        .select('id')
        .eq('short_code', shortCode)
        .single();

    if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to check short link: ${error.message}`);
    }

    if (data) throw new Error(`Short link ${shortCode} already exists.`);

    // IsValid is true by default, so we don't need to set it unless specified.
    // This is used for future reference to mark links as invalid.
    const { data: insertData, error: insertError } = await client
        .from(SHORT_LINKS_TABLE)
        .insert({
            short_code: shortCode,
            original_url: originalUrl,
            created_at: new Date().toISOString(),
            is_valid: true,
        })
        .select('*')
        .single();

    if (insertError) {
        throw new Error(`Failed to insert short link: ${insertError.message}`);
    }

    return insertData;

}