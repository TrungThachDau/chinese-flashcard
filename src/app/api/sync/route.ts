import { NextRequest, NextResponse } from 'next/server';
import { syncReviewsBatch } from '@/services/card.service';

export async function POST(request: NextRequest) {
  try {
    let body: any;
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      body = await request.json();
    } else {
      const text = await request.text();
      body = text ? JSON.parse(text) : {};
    }

    const { reviews, tz } = body;
    if (!Array.isArray(reviews) || reviews.length === 0) {
      return NextResponse.json({ ok: true, synced: 0 });
    }

    const result = await syncReviewsBatch(reviews, tz);
    return NextResponse.json({
      ok: true,
      synced: result.synced,
      stats: result.stats,
    });
  } catch (err: any) {
    console.error('Error in /api/sync:', err);
    return NextResponse.json({ ok: false, error: err.message || 'Sync failed' }, { status: 500 });
  }
}
