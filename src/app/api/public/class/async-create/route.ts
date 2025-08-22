import { NextRequest, NextResponse } from 'next/server';
import getLogger from '~/core/logger';
import getSupabaseServerActionClient from '~/core/supabase/action-client';
import { ClassCreatedEvent, TimeSlot } from '~/lib/classes/types/class-v2';
import { InvoiceService } from '~/lib/invoices/v2/invoice.service';
import { SessionService } from '~/lib/sessions/session.service';
import { ZoomService } from '~/lib/zoom/v2/zoom.service';

const logger = getLogger();

// This will handle the session creation, invoice creation and zoom meeting creation
// This will be invoked by the class created webhook using the upstash queues.
export async function POST(request: NextRequest) {
    const body = await request.json();
    const classEvent = body as ClassCreatedEvent;
    try {
        
        const supabaseClient = getSupabaseServerActionClient({ admin: true });
        const sessionService = new SessionService(supabaseClient, logger);
        const zoomService = new ZoomService(supabaseClient);
        const invoiceService = InvoiceService.getInstance(supabaseClient, logger);
        logger.info('Class created event', { classEvent });


        const timeSlots = classEvent.timeSlots as unknown as TimeSlot[];
        const sessionResult = await sessionService.createRecurringSessions(classEvent.classId, timeSlots, classEvent.startDate);
        if (!sessionResult.success) {
          logger.warn('Failed to create recurring sessions, but class was created', {
            classId: classEvent.classId,
            error: sessionResult.error.message
          });
        }

        if(classEvent.classId && classEvent.tutorId) {
          const invoiceResult = await invoiceService.createInvoiceForNewClass(classEvent.tutorId, classEvent.classId);
          if (!invoiceResult.success) {
            logger.warn('Failed to create invoice for new class, but class was created', {
              classId: classEvent.classId,
              error: invoiceResult.error.message
            });
          }
          else {
            logger.info('Invoice created for new class', {
              classId: classEvent.classId,
              invoiceId: invoiceResult.data.id
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