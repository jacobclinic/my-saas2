'use server';

import { withSession } from '~/core/generic/actions-utils';
import getSupabaseServerActionClient from '~/core/supabase/action-client';
import { createShortUrl } from './short-links-service';

export const createShortUrlAction = withSession(
    async ({ originalUrl, csrfToken }: { originalUrl: string; csrfToken: string }) => {
        const client = getSupabaseServerActionClient();
        try {
            const urlInfo = await createShortUrl(client, originalUrl);
            return { success: true, shortCode: urlInfo.short_code };
        } catch (error: any) {
            console.error('Server error:', error);
            return { success: false, error: error.message };
        }
    }
);