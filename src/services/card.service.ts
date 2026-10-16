import {
  Card,
  CardFilterOptions,
  CardStatus,
  ReviewRating,
  StudyStats,
  makeCardKey,
} from '@/models';
import {
  findAllCards,
  countCards,
  findCardById,
  findLearnedCards,
  findNewCards,
  findDueCards,
  updateCardAndInsertReview,
  batchUpdateCardsAndInsertReviews,
} from '@/repositories/sqlite/card.repository';
import { findUserSettings } from '@/repositories/sqlite/settings.repository';
import { computeSqliteStudyStats } from '@/repositories/sqlite/stats.repository';
import { isSupabaseConfigured } from '@/repositories/supabase/server.client';
import {
  upsertSupabaseCardReview,
  batchUpsertSupabaseReviews,
} from '@/repositories/supabase/progress.repository';
import { calculateFSRS } from './srs.service';
import { loadSupabaseAppData } from './app-data.service';

export function getAllCards(filters?: CardFilterOptions): Card[] {
  return findAllCards(filters);
}

export function getCardsCount(filters?: CardFilterOptions): number {
  return countCards(filters);
}

export function getCardById(id: number): Card | null {
  return findCardById(id);
}

export function getLearnedCards(limit: number = 20): Card[] {
  return findLearnedCards(limit);
}

export function getNewCards(limit: number = 5): Card[] {
  return findNewCards(limit);
}

export function getDueCards(limit?: number, allowNew: boolean = true): Card[] {
  const settings = findUserSettings();
  const maxLimit = limit ?? settings.daily_limit;
  return findDueCards(maxLimit, allowNew);
}

export function recordCardReview(cardId: number, rating: ReviewRating): Card | null {
  const currentCard = findCardById(cardId);
  if (!currentCard) return null;

  const now = new Date();
  const settings = findUserSettings();
  const targetRetention = settings.fsrs_retention ?? 0.9;
  const srsResult = calculateFSRS(currentCard, rating, now, targetRetention);

  return updateCardAndInsertReview(cardId, rating, now.toISOString(), srsResult);
}

export function recordCardReviewsBatch(
  reviews: Array<{
    card_id: number;
    rating: ReviewRating;
    reviewed_at: string;
    repetition: number;
    interval: number;
    ease_factor: number;
    due_date: string;
    status: CardStatus;
    stability?: number;
    difficulty?: number;
    lapses?: number;
    state?: number;
  }>
): void {
  batchUpdateCardsAndInsertReviews(reviews);
}

export async function getSupabaseCards(options: CardFilterOptions = {}) {
  const data = await loadSupabaseAppData({ includeAllCards: true, cardsLimit: 1000 });
  if (!data) return null;

  let cards = data.allCards;
  const now = new Date().toISOString();

  if (options.mode === 'learn_more') {
    const limit = options.limit ?? 30;
    const newCards = cards.filter((c) => c.status === 'new').slice(0, limit);
    return { cards: newCards, total: newCards.length, hasMore: false };
  }

  if (options.mode === 'review_learned') {
    const limit = options.limit ?? 30;
    const learned = cards
      .filter((c) => c.status !== 'new' || c.last_reviewed !== null)
      .sort((a, b) => (b.last_reviewed || '').localeCompare(a.last_reviewed || ''))
      .slice(0, limit);
    return { cards: learned, total: learned.length, hasMore: false };
  }

  if (options.dueOnly) {
    const limit = options.limit ?? 30;
    const due = cards.filter((c) => {
      if (options.allowNew !== false) {
        return c.due_date <= now || c.status === 'new';
      }
      return c.due_date <= now && c.status !== 'new';
    });
    return { cards: due.slice(0, limit), total: due.length, hasMore: false };
  }

  if (options.category && options.category !== 'all') {
    cards = cards.filter((c) => c.category === options.category);
  }

  if (options.status && options.status !== 'all') {
    cards = cards.filter((c) => c.status === options.status);
  }

  if (options.search) {
    const q = options.search.toLowerCase();
    cards = cards.filter(
      (c) =>
        c.hanzi.toLowerCase().includes(q) ||
        c.pinyin.toLowerCase().includes(q) ||
        c.meaning.toLowerCase().includes(q) ||
        (c.sino_vietnamese && c.sino_vietnamese.toLowerCase().includes(q))
    );
  }

  const total = cards.length;
  const offset = options.offset ?? 0;
  const limit = options.limit ?? 30;
  const paginated = cards.slice(offset, offset + limit);
  const hasMore = offset + paginated.length < total;

  return { cards: paginated, total, hasMore };
}

export async function queryCards(options: CardFilterOptions) {
  const { category, status, search, mode, dueOnly, limit, offset = 0, allowNew = true } = options;

  if (isSupabaseConfigured()) {
    try {
      const sbResult = await getSupabaseCards(options);
      if (sbResult) {
        return {
          cards: sbResult.cards,
          total: sbResult.total,
          hasMore: sbResult.hasMore,
          offset,
          limit: limit ?? sbResult.total,
        };
      }
    } catch (err) {
      console.warn('Supabase cards fetch error, falling back to SQLite:', err);
    }
  }

  if (mode === 'learn_more') {
    const cards = getNewCards(limit ?? 30);
    return { cards };
  }

  if (mode === 'review_learned') {
    const cards = getLearnedCards(limit ?? 30);
    return { cards };
  }

  if (dueOnly) {
    const cards = getDueCards(limit, allowNew);
    return { cards };
  }

  const cards = getAllCards({ category, status, search, limit, offset });
  const total = getCardsCount({ category, status, search });
  const hasMore = typeof limit === 'number' ? offset + cards.length < total : false;

  return {
    cards,
    total,
    hasMore,
    offset,
    limit: limit ?? total,
  };
}

export async function submitCardReview(
  cardId: number,
  rating: ReviewRating,
  tz?: number
): Promise<{ card: Card; stats?: StudyStats } | null> {
  const updatedCard = recordCardReview(cardId, rating);
  if (!updatedCard) return null;

  try {
    const synced = await upsertSupabaseCardReview({
      cardKey: makeCardKey(updatedCard),
      repetition: updatedCard.repetition,
      interval: updatedCard.interval,
      easeFactor: updatedCard.ease_factor,
      dueDate: updatedCard.due_date,
      lastReviewed: updatedCard.last_reviewed,
      status: updatedCard.status,
      rating,
    });

    if (synced) {
      const sbData = await loadSupabaseAppData();
      return {
        card: updatedCard,
        stats: sbData?.studyStats,
      };
    }
  } catch (sbErr) {
    console.warn('Supabase post-review sync error:', sbErr);
  }

  const stats = computeSqliteStudyStats(typeof tz === 'number' && Number.isFinite(tz) ? tz : undefined);
  return { card: updatedCard, stats };
}

export async function syncReviewsBatch(
  reviews: Array<any>,
  tz?: number
): Promise<{ synced: number; stats?: StudyStats }> {
  const syncedToSupabase = await batchUpsertSupabaseReviews(reviews);
  if (syncedToSupabase) {
    const sbData = await loadSupabaseAppData();
    return {
      synced: reviews.length,
      stats: sbData?.studyStats,
    };
  }

  recordCardReviewsBatch(reviews);
  const stats = computeSqliteStudyStats(typeof tz === 'number' ? tz : undefined);
  return { synced: reviews.length, stats };
}

