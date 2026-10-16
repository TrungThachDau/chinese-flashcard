import { NextRequest, NextResponse } from 'next/server';
import { connection } from 'next/server';
import { ReviewRating } from '@/models';
import { queryCards, submitCardReview } from '@/services/card.service';

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

    const result = await queryCards({
      category,
      status,
      search,
      mode,
      dueOnly,
      limit,
      offset,
      allowNew,
    });

    return NextResponse.json(
      { ok: true, ...result },
      { headers: { 'Cache-Control': 'no-store, must-revalidate' } }
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

    const result = await submitCardReview(cardId, rating as ReviewRating, tz);
    if (!result) {
      return NextResponse.json({ ok: false, error: 'Card not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, card: result.card, stats: result.stats });
  } catch (error) {
    console.error('Error recording review:', error);
    return NextResponse.json({ ok: false, error: 'Failed to record review' }, { status: 500 });
  }
}
