// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Card } from '@/models';

vi.mock('@/repositories/sqlite/card.repository', () => ({
  findAllCards: vi.fn(),
  countCards: vi.fn(),
  findCardById: vi.fn(),
  findLearnedCards: vi.fn(),
  findNewCards: vi.fn(),
  findDueCards: vi.fn(),
  updateCardAndInsertReview: vi.fn(),
  batchUpdateCardsAndInsertReviews: vi.fn(),
}));
vi.mock('@/repositories/sqlite/settings.repository', () => ({ findUserSettings: vi.fn() }));
vi.mock('@/repositories/sqlite/stats.repository', () => ({ computeSqliteStudyStats: vi.fn() }));
vi.mock('@/repositories/supabase/server.client', () => ({ isSupabaseConfigured: vi.fn() }));
vi.mock('@/repositories/supabase/progress.repository', () => ({
  upsertSupabaseCardReview: vi.fn(),
  batchUpsertSupabaseReviews: vi.fn(),
}));
vi.mock('./app-data.service', () => ({ loadSupabaseAppData: vi.fn() }));

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
import { loadSupabaseAppData } from './app-data.service';
import {
  getAllCards,
  getCardsCount,
  getCardById,
  getLearnedCards,
  getNewCards,
  getDueCards,
  recordCardReview,
  recordCardReviewsBatch,
  getSupabaseCards,
  queryCards,
  submitCardReview,
  syncReviewsBatch,
} from './card.service';

const NOW = new Date('2026-01-10T00:00:00.000Z');

function makeCard(overrides: Partial<Card> = {}): Card {
  return {
    id: 1,
    hanzi: '你好',
    pinyin: 'nǐ hǎo',
    meaning: 'xin chào',
    category: 'greeting',
    category_name: 'Greeting',
    repetition: 0,
    interval: 0,
    ease_factor: 2.5,
    due_date: NOW.toISOString(),
    last_reviewed: null,
    status: 'new',
    ...overrides,
  };
}

function mockAppData(allCards: Card[], studyStats?: unknown) {
  vi.mocked(loadSupabaseAppData).mockResolvedValue({ allCards, studyStats } as never);
}

const statsStub = { total_cards: 1 } as never;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('sqlite passthrough functions', () => {
  it('delegates to repositories', () => {
    const cards = [makeCard()];
    vi.mocked(findAllCards).mockReturnValue(cards);
    vi.mocked(countCards).mockReturnValue(7);
    vi.mocked(findCardById).mockReturnValue(cards[0]);
    vi.mocked(findLearnedCards).mockReturnValue(cards);
    vi.mocked(findNewCards).mockReturnValue(cards);

    expect(getAllCards({ category: 'a' })).toBe(cards);
    expect(findAllCards).toHaveBeenCalledWith({ category: 'a' });
    expect(getCardsCount()).toBe(7);
    expect(getCardById(1)).toBe(cards[0]);
    expect(getLearnedCards()).toBe(cards);
    expect(findLearnedCards).toHaveBeenCalledWith(20);
    getLearnedCards(3);
    expect(findLearnedCards).toHaveBeenLastCalledWith(3);
    expect(getNewCards()).toBe(cards);
    expect(findNewCards).toHaveBeenCalledWith(5);
    getNewCards(9);
    expect(findNewCards).toHaveBeenLastCalledWith(9);
  });

  it('getDueCards uses settings daily_limit when no limit is given', () => {
    vi.mocked(findUserSettings).mockReturnValue({ daily_limit: 15 } as never);
    vi.mocked(findDueCards).mockReturnValue([]);

    getDueCards();
    expect(findDueCards).toHaveBeenLastCalledWith(15, true);
    getDueCards(4, false);
    expect(findDueCards).toHaveBeenLastCalledWith(4, false);
  });

  it('recordCardReviewsBatch delegates to batch repository', () => {
    const reviews = [
      {
        card_id: 1,
        rating: 3 as const,
        reviewed_at: NOW.toISOString(),
        repetition: 1,
        interval: 1,
        ease_factor: 2.5,
        due_date: NOW.toISOString(),
        status: 'learning' as const,
      },
    ];
    recordCardReviewsBatch(reviews);
    expect(batchUpdateCardsAndInsertReviews).toHaveBeenCalledWith(reviews);
  });
});

describe('recordCardReview', () => {
  it('returns null when card is missing', () => {
    vi.mocked(findCardById).mockReturnValue(null);
    expect(recordCardReview(99, 3)).toBeNull();
    expect(updateCardAndInsertReview).not.toHaveBeenCalled();
  });

  it('computes FSRS result with default retention', () => {
    const card = makeCard();
    const updated = makeCard({ status: 'learning' });
    vi.mocked(findCardById).mockReturnValue(card);
    vi.mocked(findUserSettings).mockReturnValue({ daily_limit: 20 } as never);
    vi.mocked(updateCardAndInsertReview).mockReturnValue(updated);

    expect(recordCardReview(1, 3)).toBe(updated);
    expect(updateCardAndInsertReview).toHaveBeenCalledWith(
      1,
      3,
      NOW.toISOString(),
      expect.objectContaining({ status: 'learning', repetition: 1 })
    );
  });

  it('uses configured fsrs_retention', () => {
    vi.mocked(findCardById).mockReturnValue(makeCard());
    vi.mocked(findUserSettings).mockReturnValue({ daily_limit: 20, fsrs_retention: 0.8 } as never);
    vi.mocked(updateCardAndInsertReview).mockReturnValue(makeCard());

    recordCardReview(1, 4);
    const srsResult = vi.mocked(updateCardAndInsertReview).mock.calls[0][3];
    expect(srsResult.interval).toBeGreaterThan(0);
  });
});

describe('getSupabaseCards', () => {
  const cards: Card[] = [
    makeCard({
      id: 1,
      hanzi: '一',
      pinyin: 'yī',
      meaning: 'one',
      status: 'new',
      hsk: 1,
      tags: ['number'],
      category: 'num',
      sino_vietnamese: 'nhất',
      due_date: '2026-02-01T00:00:00.000Z',
    }),
    makeCard({
      id: 2,
      hanzi: '二',
      pinyin: 'èr',
      meaning: 'two',
      status: 'learning',
      hsk: 1,
      tags: ['number'],
      category: 'num',
      last_reviewed: '2026-01-05T00:00:00.000Z',
      due_date: '2026-01-01T00:00:00.000Z',
    }),
    makeCard({
      id: 3,
      hanzi: '猫',
      pinyin: 'māo',
      meaning: 'cat',
      status: 'reviewing',
      hsk: 3,
      category: 'animal',
      last_reviewed: null,
      due_date: '2026-03-01T00:00:00.000Z',
    }),
    makeCard({
      id: 4,
      hanzi: '狗',
      pinyin: 'gǒu',
      meaning: 'dog',
      status: 'mastered',
      tags: ['Pet'],
      category: 'animal',
      last_reviewed: '2026-01-08T00:00:00.000Z',
      due_date: '2026-01-02T00:00:00.000Z',
    }),
  ];

  it('returns null when no data', async () => {
    vi.mocked(loadSupabaseAppData).mockResolvedValue(null as never);
    await expect(getSupabaseCards()).resolves.toBeNull();
    expect(loadSupabaseAppData).toHaveBeenCalledWith({ includeAllCards: true, cardsLimit: 1000 });
  });

  it('learn_more returns new cards with default and custom limit', async () => {
    mockAppData(cards);
    const res = await getSupabaseCards({ mode: 'learn_more' });
    expect(res).toEqual({ cards: [cards[0]], total: 1, hasMore: false });
    const limited = await getSupabaseCards({ mode: 'learn_more', limit: 0 });
    expect(limited?.cards).toEqual([]);
  });

  it('review_learned returns learned cards sorted by last_reviewed desc', async () => {
    mockAppData(cards);
    const res = await getSupabaseCards({ mode: 'review_learned' });
    expect(res?.cards.map((c) => c.id)).toEqual([4, 2, 3]);
    expect(res?.hasMore).toBe(false);
    const limited = await getSupabaseCards({ mode: 'review_learned', limit: 1 });
    expect(limited?.cards.map((c) => c.id)).toEqual([4]);
  });

  it('dueOnly includes new cards by default', async () => {
    mockAppData(cards);
    const res = await getSupabaseCards({ dueOnly: true });
    expect(res?.cards.map((c) => c.id)).toEqual([1, 2, 4]);
    expect(res?.total).toBe(3);
  });

  it('dueOnly excludes new cards when allowNew is false and respects limit', async () => {
    mockAppData(cards);
    const res = await getSupabaseCards({ dueOnly: true, allowNew: false, limit: 1 });
    expect(res?.cards.map((c) => c.id)).toEqual([2]);
    expect(res?.total).toBe(2);
  });

  it('applies hsk, tag, category and status filters', async () => {
    mockAppData(cards);
    expect((await getSupabaseCards({ hsk: '1' }))?.total).toBe(2);
    expect((await getSupabaseCards({ hsk: 'all' }))?.total).toBe(4);
    expect((await getSupabaseCards({ tag: 'Pet' }))?.cards.map((c) => c.id)).toEqual([4]);
    expect((await getSupabaseCards({ tag: 'all' }))?.total).toBe(4);
    expect((await getSupabaseCards({ category: 'animal' }))?.total).toBe(2);
    expect((await getSupabaseCards({ category: 'all' }))?.total).toBe(4);
    expect((await getSupabaseCards({ status: 'mastered' }))?.cards.map((c) => c.id)).toEqual([4]);
    expect((await getSupabaseCards({ status: 'all' }))?.total).toBe(4);
  });

  it('searches across hanzi, pinyin, meaning, sino_vietnamese, tags and hsk', async () => {
    mockAppData(cards);
    const ids = async (search: string) =>
      (await getSupabaseCards({ search }))?.cards.map((c) => c.id);

    expect(await ids('猫')).toEqual([3]);
    expect(await ids('GǑU')).toEqual([4]);
    expect(await ids('two')).toEqual([2]);
    expect(await ids('nhất')).toEqual([1]);
    expect(await ids('pet')).toEqual([4]);
    expect(await ids('hsk 3')).toEqual([3]);
    expect(await ids('zzz')).toEqual([]);
  });

  it('paginates with offset and limit', async () => {
    mockAppData(cards);
    expect(await getSupabaseCards({ offset: 1, limit: 2 })).toEqual({
      cards: [cards[1], cards[2]],
      total: 4,
      hasMore: true,
    });
    expect(await getSupabaseCards({ offset: 2, limit: 2 })).toMatchObject({ hasMore: false });
    expect(await getSupabaseCards()).toMatchObject({ total: 4, hasMore: false });
  });
});

describe('queryCards', () => {
  it('returns supabase results when configured', async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    const card = makeCard();
    mockAppData([card]);

    await expect(queryCards({})).resolves.toEqual({
      cards: [card],
      total: 1,
      hasMore: false,
      offset: 0,
      limit: 1,
    });
    await expect(queryCards({ limit: 5, offset: 0 })).resolves.toMatchObject({ limit: 5 });
    expect(findAllCards).not.toHaveBeenCalled();
  });

  it('falls back to sqlite when supabase returns null', async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    vi.mocked(loadSupabaseAppData).mockResolvedValue(null as never);
    vi.mocked(findNewCards).mockReturnValue([]);

    await expect(queryCards({ mode: 'learn_more' })).resolves.toEqual({ cards: [] });
    expect(findNewCards).toHaveBeenCalledWith(30);
  });

  it('falls back to sqlite when supabase throws', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    vi.mocked(loadSupabaseAppData).mockRejectedValue(new Error('boom'));
    vi.mocked(findLearnedCards).mockReturnValue([]);

    await expect(queryCards({ mode: 'review_learned', limit: 4 })).resolves.toEqual({ cards: [] });
    expect(findLearnedCards).toHaveBeenCalledWith(4);
    expect(warn).toHaveBeenCalledWith(
      'Supabase cards fetch error, falling back to SQLite:',
      expect.any(Error)
    );
  });

  it('handles sqlite modes when supabase is not configured', async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(false);
    vi.mocked(findNewCards).mockReturnValue([]);
    vi.mocked(findLearnedCards).mockReturnValue([]);
    vi.mocked(findDueCards).mockReturnValue([]);
    vi.mocked(findUserSettings).mockReturnValue({ daily_limit: 12 } as never);

    await queryCards({ mode: 'learn_more', limit: 2 });
    expect(findNewCards).toHaveBeenCalledWith(2);
    await queryCards({ mode: 'review_learned' });
    expect(findLearnedCards).toHaveBeenCalledWith(30);
    await expect(queryCards({ dueOnly: true })).resolves.toEqual({ cards: [] });
    expect(findDueCards).toHaveBeenCalledWith(12, true);
    expect(loadSupabaseAppData).not.toHaveBeenCalled();
  });

  it('returns paginated sqlite cards', async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(false);
    const cards = [makeCard({ id: 1 }), makeCard({ id: 2 })];
    vi.mocked(findAllCards).mockReturnValue(cards);
    vi.mocked(countCards).mockReturnValue(5);

    await expect(
      queryCards({ category: 'c', status: 'new', search: 's', limit: 2, offset: 1 })
    ).resolves.toEqual({ cards, total: 5, hasMore: true, offset: 1, limit: 2 });
    expect(findAllCards).toHaveBeenCalledWith({
      category: 'c',
      status: 'new',
      search: 's',
      limit: 2,
      offset: 1,
    });
    expect(countCards).toHaveBeenCalledWith({ category: 'c', status: 'new', search: 's' });

    await expect(queryCards({})).resolves.toEqual({
      cards,
      total: 5,
      hasMore: false,
      offset: 0,
      limit: 5,
    });
  });
});

describe('submitCardReview', () => {
  const updated = makeCard({
    status: 'learning',
    repetition: 1,
    last_reviewed: NOW.toISOString(),
  });

  beforeEach(() => {
    vi.mocked(findUserSettings).mockReturnValue({ daily_limit: 20 } as never);
    vi.mocked(computeSqliteStudyStats).mockReturnValue(statsStub);
  });

  it('returns null when the card does not exist', async () => {
    vi.mocked(findCardById).mockReturnValue(null);
    await expect(submitCardReview(1, 3)).resolves.toBeNull();
    expect(upsertSupabaseCardReview).not.toHaveBeenCalled();
  });

  it('returns supabase stats when synced', async () => {
    vi.mocked(findCardById).mockReturnValue(makeCard());
    vi.mocked(updateCardAndInsertReview).mockReturnValue(updated);
    vi.mocked(upsertSupabaseCardReview).mockResolvedValue(true as never);
    const sbStats = { total_cards: 99 };
    mockAppData([], sbStats);

    await expect(submitCardReview(1, 3)).resolves.toEqual({ card: updated, stats: sbStats });
    expect(upsertSupabaseCardReview).toHaveBeenCalledWith({
      cardKey: '你好|nǐ hǎo',
      repetition: 1,
      interval: 0,
      easeFactor: 2.5,
      dueDate: updated.due_date,
      lastReviewed: updated.last_reviewed,
      status: 'learning',
      rating: 3,
    });
    expect(computeSqliteStudyStats).not.toHaveBeenCalled();
  });

  it('returns undefined stats when supabase data is missing after sync', async () => {
    vi.mocked(findCardById).mockReturnValue(makeCard());
    vi.mocked(updateCardAndInsertReview).mockReturnValue(updated);
    vi.mocked(upsertSupabaseCardReview).mockResolvedValue(true as never);
    vi.mocked(loadSupabaseAppData).mockResolvedValue(null as never);

    await expect(submitCardReview(1, 3)).resolves.toEqual({ card: updated, stats: undefined });
  });

  it('falls back to sqlite stats when not synced', async () => {
    vi.mocked(findCardById).mockReturnValue(makeCard());
    vi.mocked(updateCardAndInsertReview).mockReturnValue(updated);
    vi.mocked(upsertSupabaseCardReview).mockResolvedValue(false as never);

    await expect(submitCardReview(1, 3, 420)).resolves.toEqual({ card: updated, stats: statsStub });
    expect(computeSqliteStudyStats).toHaveBeenLastCalledWith(420);

    await submitCardReview(1, 3, Number.NaN);
    expect(computeSqliteStudyStats).toHaveBeenLastCalledWith(undefined);

    await submitCardReview(1, 3);
    expect(computeSqliteStudyStats).toHaveBeenLastCalledWith(undefined);
  });

  it('falls back to sqlite stats when supabase sync throws', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.mocked(findCardById).mockReturnValue(makeCard());
    vi.mocked(updateCardAndInsertReview).mockReturnValue(updated);
    vi.mocked(upsertSupabaseCardReview).mockRejectedValue(new Error('net'));

    await expect(submitCardReview(1, 2, -60)).resolves.toEqual({ card: updated, stats: statsStub });
    expect(warn).toHaveBeenCalledWith('Supabase post-review sync error:', expect.any(Error));
    expect(computeSqliteStudyStats).toHaveBeenCalledWith(-60);
  });
});

describe('syncReviewsBatch', () => {
  const reviews = [{ card_id: 1 }, { card_id: 2 }];

  it('returns supabase stats when synced', async () => {
    vi.mocked(batchUpsertSupabaseReviews).mockResolvedValue(true as never);
    const sbStats = { total_cards: 3 };
    mockAppData([], sbStats);

    await expect(syncReviewsBatch(reviews)).resolves.toEqual({ synced: 2, stats: sbStats });
    expect(batchUpdateCardsAndInsertReviews).not.toHaveBeenCalled();
  });

  it('returns undefined stats when supabase data is missing', async () => {
    vi.mocked(batchUpsertSupabaseReviews).mockResolvedValue(true as never);
    vi.mocked(loadSupabaseAppData).mockResolvedValue(null as never);

    await expect(syncReviewsBatch(reviews)).resolves.toEqual({ synced: 2, stats: undefined });
  });

  it('falls back to sqlite when not synced', async () => {
    vi.mocked(batchUpsertSupabaseReviews).mockResolvedValue(false as never);
    vi.mocked(computeSqliteStudyStats).mockReturnValue(statsStub);

    await expect(syncReviewsBatch(reviews, 120)).resolves.toEqual({ synced: 2, stats: statsStub });
    expect(batchUpdateCardsAndInsertReviews).toHaveBeenCalledWith(reviews);
    expect(computeSqliteStudyStats).toHaveBeenLastCalledWith(120);

    await syncReviewsBatch(reviews);
    expect(computeSqliteStudyStats).toHaveBeenLastCalledWith(undefined);
  });
});
