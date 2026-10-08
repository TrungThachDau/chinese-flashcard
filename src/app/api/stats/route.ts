import { NextRequest, NextResponse } from 'next/server';
import { connection } from 'next/server';
import { getStudyStats } from '@/lib/db';

export async function GET(request: NextRequest) {
  // With `cacheComponents: true`, a GET handler that never touches dynamic data
  // is prerendered once and served stale forever. Opt into request-time rendering.
  await connection();
  try {
    const tzParam = new URL(request.url).searchParams.get('tz');
    const tz = tzParam !== null && Number.isFinite(Number(tzParam)) ? Number(tzParam) : undefined;
    const stats = getStudyStats(tz);
    return NextResponse.json(
      { ok: true, stats },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ ok: false, error: 'Failed to fetch stats' }, { status: 500 });
  }
}
