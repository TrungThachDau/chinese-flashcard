import { NextRequest, NextResponse } from 'next/server';
import { recordCardReviewsBatch, getStudyStats } from '@/lib/db';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

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

    // 1. Update local database (SQLite / In-Memory store)
    recordCardReviewsBatch(reviews);

    // 2. Sync to Supabase if configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const envUserId = process.env.SUPABASE_USER_ID;

    if (supabaseUrl && (serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)) {
      try {
        let supabase: any;
        let userId = envUserId;

        // Check if there is an authenticated user via cookies
        try {
          const cookieStore = await cookies();
          const authClient = createClient(cookieStore);
          const { data: { user } } = await authClient.auth.getUser();
          if (user) {
            userId = user.id;
            supabase = authClient;
          }
        } catch {
          // No cookie session available
        }

        // Fallback to service role client if available
        if (!supabase && serviceRoleKey && userId) {
          supabase = createServerClient(supabaseUrl, serviceRoleKey, {
            cookies: {
              getAll: () => [],
              setAll: () => {},
            },
          });
        }

        if (supabase && userId) {
          // A. Bulk upsert card_progress
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

          await supabase
            .from('card_progress')
            .upsert(progressRows, { onConflict: 'user_id,card_key' });

          // B. Bulk insert review_logs
          const logRows = reviews.map((r: any) => ({
            user_id: userId,
            card_key: r.card_key,
            rating: r.rating,
            reviewed_at: r.reviewed_at,
            interval: r.interval,
            ease_factor: r.ease_factor,
          }));

          await supabase
            .from('review_logs')
            .upsert(logRows, { onConflict: 'user_id,card_key,reviewed_at', ignoreDuplicates: true });
        }
      } catch (sbErr) {
        console.warn('Supabase sync error (local data updated successfully):', sbErr);
      }
    }

    const stats = getStudyStats(typeof tz === 'number' ? tz : undefined);
    return NextResponse.json({ ok: true, synced: reviews.length, stats });
  } catch (err: any) {
    console.error('Error in /api/sync:', err);
    return NextResponse.json({ ok: false, error: err.message || 'Sync failed' }, { status: 500 });
  }
}

