import { NextRequest, NextResponse } from 'next/server';
import { connection } from 'next/server';
import { fetchStudyStats } from '@/services/stats.service';

export async function GET(request: NextRequest) {
  await connection();
  try {
    const tzParam = new URL(request.url).searchParams.get('tz');
    const tz = tzParam !== null && Number.isFinite(Number(tzParam)) ? Number(tzParam) : undefined;

    const stats = await fetchStudyStats(tz);
    return NextResponse.json(
      { ok: true, stats },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ ok: false, error: 'Failed to fetch stats' }, { status: 500 });
  }
}
