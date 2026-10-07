import { NextRequest, NextResponse } from 'next/server';
import { connection } from 'next/server';
import { getAllCards, getDueCards, recordCardReview, getStudyStats } from '@/lib/db';
import { ReviewRating } from '@/lib/types';

export async function GET(request: NextRequest) {
  await connection();
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const dueOnly = searchParams.get('dueOnly') === 'true';
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 30;

    if (dueOnly) {
      const cards = getDueCards(limit);
      return NextResponse.json({ ok: true, cards });
    }

    const cards = getAllCards({ category, status, search });
    return NextResponse.json({ ok: true, cards });
  } catch (error) {
    console.error('Error fetching cards:', error);
    return NextResponse.json({ ok: false, error: 'Failed to fetch cards' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cardId, rating } = body;

    if (!cardId || typeof rating !== 'number' || rating < 1 || rating > 4) {
      return NextResponse.json({ ok: false, error: 'Invalid cardId or rating' }, { status: 400 });
    }

    const updatedCard = recordCardReview(cardId, rating as ReviewRating);
    if (!updatedCard) {
      return NextResponse.json({ ok: false, error: 'Card not found' }, { status: 404 });
    }

    const stats = getStudyStats();
    return NextResponse.json({ ok: true, card: updatedCard, stats });
  } catch (error) {
    console.error('Error recording review:', error);
    return NextResponse.json({ ok: false, error: 'Failed to record review' }, { status: 500 });
  }
}

