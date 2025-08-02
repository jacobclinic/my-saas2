import { NextResponse } from 'next/server';
import { ZoomWebhookEventHandlerRegistry } from '~/lib/zoom/v2/webhook-handler';
import crypto from 'crypto';
import { ZoomWebhookEvent } from '~/lib/zoom/v2/types';

const ZOOM_WEBHOOK_SECRET_TOKEN = process.env.ZOOM_SECRET_TOKEN as string;

export async function POST(req: Request) {
  try {
    const isAuthenticated = await isAutheticatedRequest(req);
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const dataPayload: ZoomWebhookEvent = await req.json();
    const handlerKey =
      dataPayload.event as keyof typeof ZoomWebhookEventHandlerRegistry;
    const handler = ZoomWebhookEventHandlerRegistry[handlerKey];
    if (!handler) {
      return NextResponse.json({ error: 'Invalid event' }, { status: 400 });
    }
    const response = handler(dataPayload);
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}

export async function isAutheticatedRequest(request: Request) {
  const message = `v0:${request.headers.get('x-zm-request-timestamp')}:${JSON.stringify(request.body)}`;
  const hashForVerify = crypto
    .createHmac('sha256', ZOOM_WEBHOOK_SECRET_TOKEN)
    .update(message)
    .digest('hex');
  const signature = `v0=${hashForVerify}`;
  return request.headers.get('x-zm-signature') === signature;
}
