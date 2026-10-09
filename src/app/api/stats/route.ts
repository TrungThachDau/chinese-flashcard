import { NextRequest, NextResponse } from 'next/server';
import { connection } from 'next/server';
import { getStudyStats } from '@/lib/db';
import { loadSupabaseAppData } from '@/lib/supabaseAppData';

export async function GET(request: NextRequest) {
  await connection();
  try {
    const tzParam = new URL(request.url).searchParams.get('tz');
    const tz = tzParam !== null && Number.isFinite(Number(tzParam)) ? Number(tzParam) : undefined;

    // 1. Try Supabase if configured (for Vercel & cloud consistency)
    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
    ) {
      try {
        const sbData = await loadSupabaseAppData();
        if (sbData?.studyStats) {
          return NextResponse.json(
            { ok: true, stats: sbData.studyStats },
            { headers: { 'Cache-Control': 'no-store' } }
          );
        }
      } catch (err) {
        console.warn('Supabase stats fetch error, falling back to SQLite:', err);
      }
    }

    // 2. Fallback to SQLite
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
