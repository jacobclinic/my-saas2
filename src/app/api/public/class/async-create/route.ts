import { NextRequest, NextResponse } from 'next/server';
import getLogger from '~/core/logger';
import getSupabaseServerActionClient from '~/core/supabase/action-client';
import { ClassService } from '~/lib/classes/class.service';
import { ClassCreatedEvent, TimeSlot } from '~/lib/classes/types/class-v2';
import { createInvoiceForNewClass } from '~/lib/invoices/database/mutations';
import { SessionService } from '~/lib/sessions/session.service';
import { ShortLinksService } from '~/lib/short-links/short-links-service';
import { ZoomService } from '~/lib/zoom/v2/zoom.service';

const logger = getLogger();

export async function POST(request: NextRequest) {
    const body = await request.json();
    const classEvent = body as ClassCreatedEvent;
    try {
        
        const supabaseClient = getSupabaseServerActionClient({ admin: true });
        const classService = new ClassService(supabaseClient, logger);
        const sessionService = new SessionService(supabaseClient, logger);
        const zoomService = new ZoomService(supabaseClient);
        const shortLinksService = ShortLinksService.getInstance(supabaseClient, logger);
        logger.info('Class created event', { classEvent });
        const classUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/self-registration?classId=${classEvent.classId}`;
        const shortUrlResult = await shortLinksService.createShortUrl(classUrl);
        if (shortUrlResult.success && shortUrlResult.data.short_code) {
            const updateShortUrlResult = await classService.updateClassShortUrl(
                classEvent.classId,
                shortUrlResult.data.short_code
            );
            if (!updateShortUrlResult.success) {
                logger.warn('Failed to update class with short URL, but class was created', {
                    classId: classEvent.classId,
                    shortCode: shortUrlResult.data.short_code,
                    error: updateShortUrlResult.error.message
                });
            }
        } else {
            logger.warn('Short URL creation failed, but class was created', {
                classId: classEvent.classId,
                error: !shortUrlResult.success ? shortUrlResult.error.message : 'Short URL creation failed'
            });
        }

        const timeSlots = classEvent.timeSlots as unknown as TimeSlot[];
        const sessionResult = await sessionService.createRecurringSessions(classEvent.classId, timeSlots, classEvent.startDate);
        if (!sessionResult.success) {
          logger.warn('Failed to create recurring sessions, but class was created', {
            classId: classEvent.classId,
            error: sessionResult.error.message
          });
        }

        if (classEvent.classId) {
          const invoiceId = await createInvoiceForNewClass(supabaseClient, classEvent.classId, classEvent.tutorId);
          if (!invoiceId) {
            logger.warn('Failed to create invoice for new class, but class was created', {
              classId: classEvent.classId,
              error: 'Failed to create invoice for new class'
            });
          }
        }
        await zoomService.createMeetingsForTomorrowSessions();

        logger.info('Class created event processed', { classEvent });
        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error('Something went wrong while processing class created event', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            name: error instanceof Error ? error.name : undefined,
            classEvent: body,
            requestUrl: request.url,
            requestMethod: request.method
        });
        return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
    }
}