'use server';

import { withSession } from '~/core/generic/actions-utils';
import getSupabaseServerActionClient from '~/core/supabase/action-client';
import { createShortUrl } from './short-links-service';
import { headers } from 'next/headers';

export const createShortUrlAction = withSession(
    async ({ originalUrl, csrfToken }: { originalUrl: string; csrfToken: string }) => {
        const client = getSupabaseServerActionClient();
        try {
            const urlInfo = await createShortUrl(client, originalUrl);
            const host = headers().get('host') || 'commaeducation.lk';
            const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
            const shortUrl = `${protocol}://${host}/s/${urlInfo.short_code}`;
            return { success: true, shortCode: urlInfo.short_code, shortUrl };
        } catch (error: any) {
            console.error('Server error:', error);
            return { success: false, error: error.message };
        }
    }
);