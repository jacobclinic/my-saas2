import { NextResponse } from "next/server";
import getLogger from "~/core/logger";
import { syncZoomRecordings } from "~/lib/zoom/zoom_rec.service";

const logger = getLogger();

export async function POST(req: Request) {

  // Validate request
  const authHeader = req.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const result = await syncZoomRecordings();
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    logger.error("Cron job failed:", error);
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}