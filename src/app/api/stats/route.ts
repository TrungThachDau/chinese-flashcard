import { NextResponse } from 'next/server';
import { getStudyStats } from '@/lib/db';

export async function GET() {
  try {
    const stats = getStudyStats();
    return NextResponse.json({ ok: true, stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ ok: false, error: 'Failed to fetch stats' }, { status: 500 });
  }
}

