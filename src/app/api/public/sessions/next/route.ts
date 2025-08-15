import { NextRequest, NextResponse } from 'next/server';
import getSupabaseServerActionClient from '~/core/supabase/action-client';
import getLogger from '~/core/logger';
import { SessionService } from '~/lib/sessions/session.service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId') || '';

    if (!classId) {
      return NextResponse.json({ success: false, error: 'Missing classId' }, { status: 400 });
    }

    const client = getSupabaseServerActionClient({ admin: true });
    const logger = getLogger();
    const service = new SessionService(client, logger);

    const result = await service.getNextSessionByClassId(classId);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}


