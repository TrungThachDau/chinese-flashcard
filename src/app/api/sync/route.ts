import { NextRequest, NextResponse } from 'next/server';
import { recordCardReviewsBatch, getStudyStats } from '@/lib/db';
import { getSupabaseServerClient, loadSupabaseAppData } from '@/lib/supabaseAppData';

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

    // 1. Check if authenticated with Supabase (multi-user mode)
    const ctx = await getSupabaseServerClient();
    if (ctx) {
      const { client, userId } = ctx;

      // A. Bulk upsert card_progress for this user
      const progressRows = reviews.map((r: any) => ({
        user_id: userId,
        card_key: r.card_key,
        repetition: r.repetition,
        interval: r.interval,
        ease_factor: r.ease_factor,
        due_date: r.due_date,
        last_reviewed: r.reviewed_at,
        status: r.status,
        updated_at: new Date().toISOString(),
      }));

      await client
        .from('card_progress')
        .upsert(progressRows, { onConflict: 'user_id,card_key' });

      // B. Bulk insert review_logs for this user
      const logRows = reviews.map((r: any) => ({
        user_id: userId,
        card_key: r.card_key,
        rating: r.rating,
        reviewed_at: r.reviewed_at,
        interval: r.interval,
        ease_factor: r.ease_factor,
      }));

      await client
        .from('review_logs')
        .upsert(logRows, { onConflict: 'user_id,card_key,reviewed_at', ignoreDuplicates: true });

      const sbData = await loadSupabaseAppData();
      return NextResponse.json({
        ok: true,
        synced: reviews.length,
        stats: sbData?.studyStats,
      });
    }

    // 2. Fallback to local database (SQLite / In-Memory store) when offline/no Supabase
    recordCardReviewsBatch(reviews);
    const stats = getStudyStats(typeof tz === 'number' ? tz : undefined);
    return NextResponse.json({ ok: true, synced: reviews.length, stats });
  } catch (err: any) {
    console.error('Error in /api/sync:', err);
    return NextResponse.json({ ok: false, error: err.message || 'Sync failed' }, { status: 500 });
  }
}

