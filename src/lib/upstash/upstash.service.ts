import { Client } from '@upstash/qstash';
import type { Logger } from 'pino';
import client from './client';
import { Result, success, failure } from '~/lib/shared/result';
import { ServiceError } from '~/lib/shared/errors';
import type { PublishMessage, PublishResult } from './types';

export class UpstashService {
    private static instance: UpstashService;
    private client: Client;
    private logger: Logger;

    private constructor(logger: Logger) {
        this.client = client;
        this.logger = logger;
    }

    public static getInstance(logger: Logger): UpstashService {
        if (!UpstashService.instance) {
            UpstashService.instance = new UpstashService(logger);
        }
        return UpstashService.instance;
    }

    async publishToUpstash<T>(params: PublishMessage<T>): Promise<Result<PublishResult>> {
        try {
            this.logger.info('Publishing message to Upstash', {
                url: params.url,
                hasBody: !!params.body,
                delay: params.delay,
                retries: params.retries
            });

            const result = await this.client.publishJSON({
                url: params.url,
                body: params.body,
                delay: params.delay,
                retries: params.retries,
            });

            this.logger.info('Message published successfully to Upstash', {
                messageId: result.messageId,
                url: params.url
            });

            return success({
                messageId: result.messageId,
                timestamp: Date.now(),
            });
        } catch (error) {
            this.logger.error('Failed to publish message to Upstash', {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                name: error instanceof Error ? error.name : undefined,
                url: params.url,
                hasBody: !!params.body,
            });

            return failure(new ServiceError('Failed to publish message to Upstash'));
        }
    }

    async publishDelayedMessage<T>(params: Omit<PublishMessage<T>, 'delay'>,delayInSeconds: number): Promise<Result<PublishResult>> {
        return this.publishToUpstash({
            ...params,
            delay: delayInSeconds,
        });
    }


    async publishWithRetries<T>(params: Omit<PublishMessage<T>, 'retries'>, maxRetries: number): Promise<Result<PublishResult>> {
        return this.publishToUpstash({
            ...params,
            retries: maxRetries,
        });
    }
}