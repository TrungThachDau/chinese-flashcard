import { NextRequest, NextResponse } from 'next/server';
import { connection } from 'next/server';
import {
  getAllCards,
  getCardsCount,
  getDueCards,
  getLearnedCards,
  getNewCards,
  recordCardReview,
  getStudyStats,
} from '@/lib/db';
import { ReviewRating } from '@/lib/types';
import { getSupabaseCards, getSupabaseServerClient } from '@/lib/supabaseAppData';

export async function GET(request: NextRequest) {
  await connection();
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const mode = searchParams.get('mode') || undefined;
    const dueOnly = searchParams.get('dueOnly') === 'true';
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');

    const limit = limitParam === 'all' ? undefined : limitParam ? parseInt(limitParam, 10) : 30;
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;
    const allowNew = searchParams.get('allowNew') !== 'false';

    const noStoreHeader = { headers: { 'Cache-Control': 'no-store, must-revalidate' } };

    // 1. Try Supabase if configured (for Vercel & cloud consistency)
    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
    ) {
      try {
        const sbResult = await getSupabaseCards({
          category,
          status,
          search,
          mode,
          dueOnly,
          limit,
          offset,
          allowNew,
        });
        if (sbResult) {
          return NextResponse.json(
            {
              ok: true,
              cards: sbResult.cards,
              total: sbResult.total,
              hasMore: sbResult.hasMore,
              offset,
              limit: limit ?? sbResult.total,
            },
            noStoreHeader
          );
        }
      } catch (err) {
        console.warn('Supabase cards fetch error, falling back to SQLite:', err);
      }
    }

    // 2. Fallback to SQLite (local development mode)
    if (mode === 'learn_more') {
      const cards = getNewCards(limit ?? 30);
      return NextResponse.json({ ok: true, cards }, noStoreHeader);
    }

    if (mode === 'review_learned') {
      const cards = getLearnedCards(limit ?? 30);
      return NextResponse.json({ ok: true, cards }, noStoreHeader);
    }

    if (dueOnly) {
      const cards = getDueCards(limit, allowNew);
      return NextResponse.json({ ok: true, cards }, noStoreHeader);
    }

    // Default: Vocabulary exploration with optional pagination
    const cards = getAllCards({ category, status, search, limit, offset });
    const total = getCardsCount({ category, status, search });
    const hasMore = typeof limit === 'number' ? offset + cards.length < total : false;

    return NextResponse.json(
      {
        ok: true,
        cards,
        total,
        hasMore,
        offset,
        limit: limit ?? total,
      },
      noStoreHeader
    );
  } catch (error) {
    console.error('Error fetching cards:', error);
    return NextResponse.json({ ok: false, error: 'Failed to fetch cards' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  await connection();
  try {
    const body = await request.json();
    const { cardId, rating, tz } = body;

    if (!cardId || typeof rating !== 'number' || rating < 1 || rating > 4) {
      return NextResponse.json({ ok: false, error: 'Invalid cardId or rating' }, { status: 400 });
    }

    const updatedCard = recordCardReview(cardId, rating as ReviewRating);
    if (!updatedCard) {
      return NextResponse.json({ ok: false, error: 'Card not found' }, { status: 404 });
    }

    // Sync to Supabase if configured
    try {
      const ctx = await getSupabaseServerClient();
      if (ctx) {
        const { client, userId } = ctx;
        const key = `${updatedCard.hanzi}|${updatedCard.pinyin}`;
        await client.from('card_progress').upsert(
          {
            user_id: userId,
            card_key: key,
            repetition: updatedCard.repetition,
            interval: updatedCard.interval,
            ease_factor: updatedCard.ease_factor,
            due_date: updatedCard.due_date,
            last_reviewed: updatedCard.last_reviewed,
            status: updatedCard.status,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,card_key' }
        );

        await client.from('review_logs').upsert(
          {
            user_id: userId,
            card_key: key,
            rating,
            reviewed_at: updatedCard.last_reviewed || new Date().toISOString(),
            interval: updatedCard.interval,
            ease_factor: updatedCard.ease_factor,
          },
          { onConflict: 'user_id,card_key,reviewed_at', ignoreDuplicates: true }
        );
      }
    } catch (sbErr) {
      console.warn('Supabase post-review sync error:', sbErr);
    }

    const stats = getStudyStats(typeof tz === 'number' && Number.isFinite(tz) ? tz : undefined);
    return NextResponse.json({ ok: true, card: updatedCard, stats });
  } catch (error) {
    console.error('Error recording review:', error);
    return NextResponse.json({ ok: false, error: 'Failed to record review' }, { status: 500 });
  }
}
