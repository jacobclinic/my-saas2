import { NextResponse } from 'next/server';
import { getSignedUrl } from '~/lib/aws/s3.service';
import getLogger from '~/core/logger';

const logger = getLogger();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const fileName = searchParams.get('fileName');

  if (!fileName) {
    return NextResponse.json({ error: 'Missing fileName' }, { status: 400 });
  }

  try {
    logger.info(`[API] Generating signed URL for ${fileName}`);
    const url = await getSignedUrl(fileName);
    return NextResponse.json({ signedUrl: url });
  } catch (error) {
    logger.error(`[API] Error generating signed URL for ${fileName}:`, error);
    return NextResponse.json({ error: 'Failed to generate signed URL' }, { status: 500 });
  }
}