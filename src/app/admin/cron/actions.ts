'use server';

import { revalidatePath } from 'next/cache';
import getLogger from '~/core/logger';

const logger = getLogger();

interface CronJobResult {
  success: boolean;
  message: string;
  error?: string;
}

export async function triggerCronJob(endpoint: string): Promise<CronJobResult> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      logger.error('CRON_SECRET environment variable is not set');
      return {
        success: false,
        message: 'Configuration error',
        error: 'CRON_SECRET is not configured',
      };
    }

    const url = `${baseUrl}${endpoint}`;

    logger.info(`Triggering cron job: ${url}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cronSecret}`,
        'Content-Type': 'application/json',
      },
    });

    const responseText = await response.text();

    if (!response.ok) {
      logger.error(`Cron job failed: ${endpoint}`, {
        status: response.status,
        statusText: response.statusText,
        response: responseText,
      });

      return {
        success: false,
        message: `HTTP ${response.status}: ${response.statusText}`,
        error: responseText,
      };
    }

    logger.info(`Cron job completed successfully: ${endpoint}`);

    // Try to parse JSON response, fallback to text
    let message = responseText;
    try {
      const jsonResponse = JSON.parse(responseText);
      message = jsonResponse.message || jsonResponse.summary?.note || responseText;
    } catch {
      // Response is not JSON, use as-is
    }

    revalidatePath('/admin/cron');

    return {
      success: true,
      message: message || 'Job completed successfully',
    };

  } catch (error) {
    logger.error(`Error triggering cron job: ${endpoint}`, {
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      success: false,
      message: 'Failed to trigger cron job',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}