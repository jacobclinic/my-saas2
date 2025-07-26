import { createClient } from '@supabase/supabase-js';
import getLogger from '~/core/logger';
import { ZoomService } from '~/lib/zoom/v2/zoom.service';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const logger = getLogger();

export async function POST(req: Request) {
    try {

        if (!supabaseUrl || !supabaseKey) {
            logger.error('Supabase URL or Key is not defined');
            return new Response('Internal Server Error', { status: 500 });
        }

        // Validate request
        const authHeader = req.headers.get('Authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return new Response('Unauthorized', { status: 401 });
        }

        const supabase = createClient(supabaseUrl!, supabaseKey!, {
            auth: {
                persistSession: false,
            },
        });

        const zoomService = new ZoomService(supabase);
        const sessions = await zoomService.createMeetingsForTomorrowSessions();

        return new Response('Zoom sessions created successfully', { status: 200 });
    } catch (error) {
        logger.error('Error in POST /api/public/create-zoom-sessions:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}