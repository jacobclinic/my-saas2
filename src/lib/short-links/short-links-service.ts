import { getShortLinkByCode } from './database/queries';
import { insertShortLink } from './database/mutations';
import { generateId } from '../utils/nanoid-utils';
import { Client, ShortLink } from './types';
import getLogger from '~/core/logger';
import { Logger } from 'pino';
import { failure, Result, success } from '../shared/result';
import { AppError } from '../shared/errors';
import { ErrorCodes } from '../shared/error-codes';
export class ShortLinksService {
    private static instance: ShortLinksService;

    private constructor(private readonly client: Client, private readonly logger: Logger) {
        this.client = client;
        this.logger = logger;
    }

    public static getInstance(client: Client, logger: Logger): ShortLinksService {
        if (!ShortLinksService.instance) {
            ShortLinksService.instance = new ShortLinksService(client, logger);
        }
        return ShortLinksService.instance;
    }

    async createShortUrl(originalUrl: string): Promise<Result<ShortLink>> {
        try {
            if (!isValidUrl(originalUrl)) {
                return failure(new AppError('Invalid URL', ErrorCodes.INVALID_URL));
            }
            const shortCode = generateId(12);
            const result = await insertShortLink(this.client, shortCode, originalUrl);
            
            this.logger.info('Short URL created successfully', {
                shortCode,
                originalUrl
            });
            
            return success(result);
        } catch (error) {
            this.logger.error('Failed to create short URL', {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                name: error instanceof Error ? error.name : undefined,
                originalUrl
            });
            return failure(new AppError('Error creating short URL', ErrorCodes.DATABASE_ERROR));
        }
    }

    async getOriginalUrl(shortCode: string): Promise<Result<string>> {
        try {
            const shortLink = await getShortLinkByCode(this.client, shortCode);
            
            if (!shortLink.is_valid) {
                return failure(new AppError('This short link is no longer valid', ErrorCodes.RESOURCE_NOT_FOUND));
            }
            
            this.logger.info('Retrieved original URL successfully', {
                shortCode,
                originalUrl: shortLink.original_url
            });
            
            return success(shortLink.original_url);
        } catch (error) {
            this.logger.error('Failed to get original URL', {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                name: error instanceof Error ? error.name : undefined,
                shortCode
            });
            return failure(new AppError('Error retrieving original URL', ErrorCodes.DATABASE_ERROR));
        }
    }
}

function isValidUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

// Legacy standalone functions for backward compatibility
// These internally use the singleton service for consistency
export async function createShortUrl(client: Client, originalUrl: string): Promise<ShortLink> {
    const logger = getLogger();
    const service = ShortLinksService.getInstance(client, logger);
    const result = await service.createShortUrl(originalUrl);
    
    if (!result.success) {
        throw new Error(result.error.message);
    }
    
    return result.data;
}

export async function getOriginalUrl(client: Client, shortCode: string): Promise<string> {
    const logger = getLogger();
    const service = ShortLinksService.getInstance(client, logger);
    const result = await service.getOriginalUrl(shortCode);
    
    if (!result.success) {
        throw new Error(result.error.message);
    }
    
    return result.data;
}