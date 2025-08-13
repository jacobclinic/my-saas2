'use server';

import { withSession } from '~/core/generic/actions-utils';
import getSupabaseServerActionClient from '~/core/supabase/action-client';
import { createShortUrl } from './short-links-service';
import { headers } from 'next/headers';
import { COMMA_EDU_DOMAIN } from '../constants-v2';

export const createShortUrlAction = withSession(
    async ({ originalUrl }: { originalUrl: string; }) => {
        const client = getSupabaseServerActionClient();
        try {
            const urlInfo = await createShortUrl(client, originalUrl);
            const host = headers().get('host') || COMMA_EDU_DOMAIN;
            const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
            const shortUrl = `${protocol}://${host}/s/${urlInfo.short_code}`;
            return { success: true, shortCode: urlInfo.short_code, shortUrl };
        } catch (error: any) {
            console.error('Server error:', error);
            return { success: false, error: error.message };
        }
    }
);