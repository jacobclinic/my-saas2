import { createClient } from '@supabase/supabase-js';
import getLogger from '~/core/logger';
import { InvoiceService } from '~/lib/invoices/v2/invoice.service';

export async function POST(req: Request) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const supabase = createClient(supabaseUrl!, supabaseKey!, {
        auth: {
            persistSession: false,
        },
    });

    const logger = getLogger();

    try {
        const authHeader = req.headers.get('Authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return new Response('Unauthorized', { status: 401 });
        }

        const invoiceService = InvoiceService.getInstance(supabase, logger);
        const result = await invoiceService.generateMonthlyTutorInvoices();

        if(result.success){
            logger.info('Tutor invoices generated successfully');
        }else{
            logger.error('Error generating tutor invoices', {
                error: result.error,
            });
            return new Response('Error generating tutor invoices', { status: 500 });
        }

        return new Response('Tutor invoices generated successfully', { status: 200 });
    } catch (error) {
        logger.error('Error in GET /api/public/cron/tutor-invoices:', {
            error: error,
        });
        return new Response('Internal Server Error', { status: 500 });
    }
}
