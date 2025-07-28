import { getShortLinkByCode } from './database/queries';
import { insertShortLink } from './database/mutations';
import { generateId } from '../utils/nanoid-utils';
import { Client, ShortLink } from './types';

function isValidUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

export async function createShortUrl(client: Client, originalUrl: string): Promise<ShortLink> {
    
    if (!isValidUrl(originalUrl)) {
        throw new Error('Invalid URL');
    }

    const shortCode = generateId(12);
    const result = await insertShortLink(client, shortCode, originalUrl);
    return result;
}

export async function getOriginalUrl(client: Client, shortCode: string): Promise<string> {
    const shortLink = await getShortLinkByCode(client, shortCode);
    if (!shortLink.is_valid) {
        throw new Error('This short link is no longer valid');
    }
    return shortLink.original_url;
}