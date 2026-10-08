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

    const noStoreHeader = { headers: { 'Cache-Control': 'no-store, must-revalidate' } };

    if (mode === 'learn_more') {
      const limit = limitParam ? parseInt(limitParam, 10) : 30;
      const cards = getNewCards(limit);
      return NextResponse.json({ ok: true, cards }, noStoreHeader);
    }

    if (mode === 'review_learned') {
      const limit = limitParam ? parseInt(limitParam, 10) : 30;
      const cards = getLearnedCards(limit);
      return NextResponse.json({ ok: true, cards }, noStoreHeader);
    }

    if (dueOnly) {
      const limit = limitParam ? parseInt(limitParam, 10) : 30;
      const allowNew = searchParams.get('allowNew') !== 'false';
      const cards = getDueCards(limit, allowNew);
      return NextResponse.json({ ok: true, cards }, noStoreHeader);
    }

    // Default: Vocabulary exploration with optional pagination
    const limit = limitParam === 'all' ? undefined : limitParam ? parseInt(limitParam, 10) : 30;
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

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

    const stats = getStudyStats(typeof tz === 'number' && Number.isFinite(tz) ? tz : undefined);
    return NextResponse.json({ ok: true, card: updatedCard, stats });
  } catch (error) {
    console.error('Error recording review:', error);
    return NextResponse.json({ ok: false, error: 'Failed to record review' }, { status: 500 });
  }
}

