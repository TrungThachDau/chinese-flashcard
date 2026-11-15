// @vitest-environment node

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LocalCardProgress, LocalReviewQueueItem } from '@/models';

const mocks = vi.hoisted(() => ({ getLocalDb: vi.fn() }));

vi.mock('@/repositories/local/indexeddb.repository', () => ({ getLocalDb: mocks.getLocalDb }));

vi.mock('@/models/data/hsk30Data', () => ({
  HSK30_LEVEL1_CARDS: [
    {
      id: '1',
      hanzi: '爱',
      pinyin: 'ài',
      meaning: 'yêu',
      sino_vietnamese: 'ái',
      category: 'greetings',
      category_name: 'Chào hỏi',
      hsk: 1,
      tags: ['HSK 1'],
    },
    { id: '2', hanzi: '八', pinyin: 'bā', meaning: 'tám', category: 'numbers', category_name: 'Số' },
    {
      id: '3',
      hanzi: '爸',
      pinyin: 'bà',
      meaning: 'bố',
      sino_vietnamese: 'bá',
      category: 'greetings',
      category_name: 'Chào hỏi',
      hsk: 2,
      tags: ['Family'],
    },
    {
      id: '4',
      hanzi: '白',
      pinyin: 'bái',
      meaning: 'trắng',
      sino_vietnamese: 'bạch',
      category: 'numbers',
      category_name: 'Số',
      hsk: 1,
      tags: ['HSK 1'],
    },
  ],
}));

vi.mock('@/models/data/initialData', () => ({
  CATEGORIES_CONFIG: [
    { id: 'greetings', name: 'Greetings', icon: 'g', color: 'c1' },
    { id: 'numbers', name: 'Numbers', icon: 'n', color: 'c2' },
  ],
  INITIAL_LIFE_QUESTIONS: [
    { id: 1, topic: 't1', question: 'q1', options: ['a', 'b'] },
    { id: 2, topic: 't2', question: 'q2', options: ['c'] },
  ],
}));

import {
  clearGuestData,
  completeGuestQuestion,
  getGuestDueCards,
  getGuestQuestions,
  getGuestSettings,
  getGuestStats,
  importGuestDataToAccount,
  queryGuestCards,
  readGuestImportPayload,
  recordGuestReview,
  saveGuestSettings,
} from '@/services/guest.service';

const NOW = new Date(2026, 10, 15, 12, 0, 0);
const NOW_ISO = NOW.toISOString();
const PAST = new Date(2026, 10, 1).toISOString();
const PAST_LATER = new Date(2026, 10, 10).toISOString();
const FUTURE = new Date(2026, 11, 1).toISOString();

type Row = Record<string, any>;

function createTable(keyField?: string) {
  let rows: Row[] = [];
  let autoId = 1;
  return {
    get rows() {
      return rows;
    },
    seed(data: Row[]) {
      rows = [...data];
    },
    toArray: vi.fn(async () => [...rows]),
    get: vi.fn(async (key: unknown) => rows.find((r) => keyField && r[keyField] === key)),
    put: vi.fn(async (row: Row) => {
      rows = rows.filter((r) => !(keyField && r[keyField] === row[keyField]));
      rows.push(row);
    }),
    add: vi.fn(async (row: Row) => {
      rows.push({ id: autoId++, ...row });
    }),
    clear: vi.fn(async () => {
      rows = [];
    }),
  };
}

function createDb() {
  const db = {
    guest_progress: createTable('card_key'),
    guest_logs: createTable(),
    guest_meta: createTable('key'),
    transaction: vi.fn(async (_mode: string, ...args: unknown[]) => {
      const fn = args[args.length - 1] as () => Promise<void>;
      return fn();
    }),
  };
  return db;
}

type FakeDb = ReturnType<typeof createDb>;

function progress(card_key: string, patch: Partial<LocalCardProgress> = {}): LocalCardProgress {
  return {
    card_key,
    card_id: 1,
    repetition: 1,
    interval: 1,
    ease_factor: 2.5,
    due_date: PAST,
    last_reviewed: PAST,
    status: 'learning',
    updated_at: PAST,
    ...patch,
  };
}

let db: FakeDb;

beforeAll(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
});

afterAll(() => {
  vi.useRealTimers();
});

beforeEach(() => {
  db = createDb();
  mocks.getLocalDb.mockReturnValue(db);
});

describe('guest settings', () => {
  it('returns defaults when there is no db', async () => {
    mocks.getLocalDb.mockReturnValue(null);
    const settings = await getGuestSettings();
    expect(settings.daily_limit).toBe(15);
    expect(settings.has_onboarded).toBe(false);
  });

  it('returns defaults when nothing is stored', async () => {
    await expect(getGuestSettings()).resolves.toMatchObject({ daily_limit: 15 });
  });

  it('merges stored settings', async () => {
    db.guest_meta.seed([{ key: 'settings', value: { daily_limit: 3, user_name: 'An' } }]);
    await expect(getGuestSettings()).resolves.toMatchObject({ daily_limit: 3, user_name: 'An' });
  });

  it('saves settings and marks onboarded', async () => {
    const merged = await saveGuestSettings({ daily_limit: 7 });
    expect(merged).toMatchObject({ daily_limit: 7, has_onboarded: true });
    expect(db.guest_meta.put).toHaveBeenCalledWith({
      key: 'settings',
      value: merged,
      updated_at: NOW_ISO,
    });
  });

  it('returns merged settings without persisting when there is no db', async () => {
    mocks.getLocalDb.mockReturnValue(null);
    await expect(saveGuestSettings({ daily_limit: 9 })).resolves.toMatchObject({
      daily_limit: 9,
      has_onboarded: true,
    });
  });
});

describe('getGuestDueCards', () => {
  it('returns base cards with defaults applied when there is no progress', async () => {
    const cards = await getGuestDueCards();
    expect(cards).toHaveLength(4);
    const ba = cards.find((c) => c.hanzi === '八')!;
    expect(ba).toMatchObject({ id: 2, hsk: 1, tags: ['HSK 1'], status: 'new', due_date: NOW_ISO });
  });

  it('works without a db', async () => {
    mocks.getLocalDb.mockReturnValue(null);
    await expect(getGuestDueCards(2)).resolves.toHaveLength(2);
  });

  it('merges progress, sorts by priority and due date, and respects allowNew', async () => {
    db.guest_progress.seed([
      progress('爱|ài', { status: 'learning', due_date: PAST_LATER, stability: 3, difficulty: 4, lapses: 1, state: 2 }),
      progress('爸|bà', { status: 'learning', due_date: PAST }),
      progress('八|bā', { status: 'reviewing', due_date: FUTURE }),
    ]);

    const withNew = await getGuestDueCards();
    expect(withNew.map((c) => c.hanzi)).toEqual(['爸', '爱', '白']);
    expect(withNew[1]).toMatchObject({ stability: 3, difficulty: 4, lapses: 1, state: 2 });
    expect(withNew[0]).toMatchObject({ stability: 0, difficulty: 0, lapses: 0, state: 0 });

    const withoutNew = await getGuestDueCards(10, false);
    expect(withoutNew.map((c) => c.hanzi)).toEqual(['爸', '爱']);
  });

  it('puts unknown statuses last', async () => {
    db.guest_progress.seed([
      progress('爱|ài', { status: 'weird' as never }),
      progress('爸|bà', { status: 'mastered' }),
    ]);
    const cards = await getGuestDueCards(10, false);
    expect(cards.map((c) => c.hanzi)).toEqual(['爸', '爱']);
  });

  it('uses the stored daily limit', async () => {
    db.guest_meta.seed([{ key: 'settings', value: { daily_limit: 1 } }]);
    await expect(getGuestDueCards()).resolves.toHaveLength(1);
  });
});

describe('recordGuestReview', () => {
  const item: LocalReviewQueueItem = {
    card_id: 1,
    card_key: '爱|ài',
    rating: 3,
    reviewed_at: NOW_ISO,
    repetition: 1,
    interval: 1,
    ease_factor: 2.5,
    due_date: FUTURE,
    status: 'learning',
    stability: 1,
    difficulty: 2,
    lapses: 0,
    state: 1,
  };

  it('does nothing without a db', async () => {
    mocks.getLocalDb.mockReturnValue(null);
    await expect(recordGuestReview(item)).resolves.toBeUndefined();
  });

  it('stores progress and a log inside a transaction', async () => {
    await recordGuestReview(item);
    expect(db.transaction).toHaveBeenCalledWith('rw', db.guest_progress, db.guest_logs, expect.any(Function));
    expect(db.guest_progress.rows).toEqual([
      expect.objectContaining({ card_key: '爱|ài', last_reviewed: NOW_ISO, status: 'learning', updated_at: NOW_ISO }),
    ]);
    expect(db.guest_logs.rows).toEqual([
      { id: 1, card_key: '爱|ài', rating: 3, reviewed_at: NOW_ISO, interval: 1, ease_factor: 2.5 },
    ]);
  });
});

describe('queryGuestCards', () => {
  const q = (s: string) => queryGuestCards(new URLSearchParams(s));

  it('returns paged cards with defaults', async () => {
    const res = await q('');
    expect(res).toMatchObject({ ok: true, total: 4, hasMore: false });
    expect(res.cards).toHaveLength(4);
  });

  it('supports limit, offset and hasMore', async () => {
    const first = await q('limit=2');
    expect(first.cards.map((c) => c.hanzi)).toEqual(['爱', '八']);
    expect(first.hasMore).toBe(true);
    const second = await q('limit=2&offset=2');
    expect(second.cards.map((c) => c.hanzi)).toEqual(['爸', '白']);
    expect(second.hasMore).toBe(false);
    const all = await q('limit=all');
    expect(all.cards).toHaveLength(4);
  });

  it('returns new cards in learn_more mode', async () => {
    db.guest_progress.seed([progress('爱|ài')]);
    const res = await q('mode=learn_more&limit=2');
    expect(res.cards.map((c) => c.hanzi)).toEqual(['八', '爸']);
    expect(res).toMatchObject({ total: 2, hasMore: false });
  });

  it('returns learned cards sorted by last review in review_learned mode', async () => {
    db.guest_progress.seed([
      progress('爱|ài', { last_reviewed: PAST }),
      progress('爸|bà', { status: 'learning', last_reviewed: null }),
      progress('白|bái', { status: 'new', last_reviewed: PAST_LATER }),
    ]);
    const res = await q('mode=review_learned');
    expect(res.cards.map((c) => c.hanzi)).toEqual(['白', '爱', '爸']);
    expect(res.total).toBe(3);
  });

  it('filters due cards', async () => {
    db.guest_progress.seed([
      progress('爱|ài', { due_date: FUTURE, status: 'reviewing' }),
      progress('爸|bà', { due_date: PAST, status: 'learning' }),
    ]);
    const withNew = await q('dueOnly=true&limit=1');
    expect(withNew.total).toBe(3);
    expect(withNew.cards).toHaveLength(1);
    const withoutNew = await q('dueOnly=true&allowNew=false');
    expect(withoutNew.cards.map((c) => c.hanzi)).toEqual(['爸']);
  });

  it('filters by hsk, category and status', async () => {
    db.guest_progress.seed([progress('白|bái', { status: 'mastered' })]);
    expect((await q('hsk=2')).cards.map((c) => c.hanzi)).toEqual(['爸']);
    expect((await q('hsk=all&category=numbers')).cards.map((c) => c.hanzi)).toEqual(['八', '白']);
    expect((await q('category=all&status=mastered')).cards.map((c) => c.hanzi)).toEqual(['白']);
    expect((await q('status=all')).total).toBe(4);
  });

  it('searches hanzi, pinyin, meaning, sino-vietnamese and tags', async () => {
    expect((await q('search=爸')).cards.map((c) => c.hanzi)).toEqual(['爸']);
    expect((await q('search=BĀ')).cards.map((c) => c.hanzi)).toEqual(['八']);
    expect((await q('search=trắng')).cards.map((c) => c.hanzi)).toEqual(['白']);
    expect((await q('search=bạch')).cards.map((c) => c.hanzi)).toEqual(['白']);
    expect((await q('search=family')).cards.map((c) => c.hanzi)).toEqual(['爸']);
    expect((await q('search=zzz')).total).toBe(0);
  });
});

describe('getGuestStats', () => {
  it('computes stats without a db', async () => {
    mocks.getLocalDb.mockReturnValue(null);
    const stats = await getGuestStats();
    expect(stats).toMatchObject({
      total_cards: 4,
      new_cards: 4,
      due_today: 4,
      retention_rate: 100,
      streak_days: 0,
      total_reviews: 0,
      today_reviewed_count: 0,
    });
    expect(stats.categories).toEqual([
      expect.objectContaining({ id: 'greetings', total: 2, new_count: 2, reviewing_count: 2 }),
      expect.objectContaining({ id: 'numbers', total: 2, new_count: 2 }),
    ]);
  });

  it('counts statuses, retention and a streak including today', async () => {
    db.guest_progress.seed([
      progress('爱|ài', { status: 'mastered', due_date: FUTURE }),
      progress('八|bā', { status: 'learning' }),
      progress('爸|bà', { status: 'reviewing', due_date: FUTURE }),
    ]);
    db.guest_logs.seed([
      { card_key: '爱|ài', rating: 4, reviewed_at: new Date(2026, 10, 15, 9).toISOString() },
      { card_key: '爱|ài', rating: 1, reviewed_at: new Date(2026, 10, 14, 9).toISOString() },
      { card_key: '爱|ài', rating: 3, reviewed_at: new Date(2026, 10, 13, 9).toISOString() },
      { card_key: '爱|ài', rating: 2, reviewed_at: new Date(2026, 10, 10, 9).toISOString() },
    ]);

    const stats = await getGuestStats();
    expect(stats).toMatchObject({
      total_cards: 4,
      new_cards: 1,
      learning_cards: 1,
      reviewing_cards: 1,
      mastered_cards: 1,
      due_today: 2,
      retention_rate: 50,
      streak_days: 3,
      total_reviews: 4,
      today_reviewed_count: 1,
    });
    expect(stats.categories[0]).toMatchObject({
      id: 'greetings',
      mastered_count: 1,
      reviewing_count: 1,
      new_count: 0,
    });
    expect(stats.categories[1]).toMatchObject({ id: 'numbers', learning_count: 1, new_count: 1 });
  });

  it('keeps the streak when the last review was yesterday', async () => {
    db.guest_logs.seed([
      { card_key: '爱|ài', rating: 3, reviewed_at: new Date(2026, 10, 14, 9).toISOString() },
      { card_key: '爱|ài', rating: 3, reviewed_at: new Date(2026, 10, 13, 9).toISOString() },
    ]);
    const stats = await getGuestStats();
    expect(stats.streak_days).toBe(2);
    expect(stats.today_reviewed_count).toBe(0);
  });
});

describe('guest questions', () => {
  it('returns base questions without progress when there is no db', async () => {
    mocks.getLocalDb.mockReturnValue(null);
    const questions = await getGuestQuestions();
    expect(questions.map((q) => q.completed)).toEqual([false, false]);
    expect(questions[0].last_practiced).toBeNull();
  });

  it('merges stored progress', async () => {
    db.guest_meta.seed([{ key: 'life_questions', value: { 1: PAST, 2: null } }]);
    const questions = await getGuestQuestions();
    expect(questions[0]).toMatchObject({ id: 1, completed: true, last_practiced: PAST, options: ['a', 'b'] });
    expect(questions[1]).toMatchObject({ id: 2, completed: true, last_practiced: null });
  });

  it('does nothing when completing without a db', async () => {
    mocks.getLocalDb.mockReturnValue(null);
    await expect(completeGuestQuestion(1)).resolves.toBeUndefined();
  });

  it('stores completion time', async () => {
    db.guest_meta.seed([{ key: 'life_questions', value: { 2: PAST } }]);
    await completeGuestQuestion(1);
    expect(db.guest_meta.put).toHaveBeenCalledWith({
      key: 'life_questions',
      value: { 1: NOW_ISO, 2: PAST },
      updated_at: NOW_ISO,
    });
  });
});

describe('clearGuestData', () => {
  it('does nothing without a db', async () => {
    mocks.getLocalDb.mockReturnValue(null);
    await expect(clearGuestData()).resolves.toBeUndefined();
  });

  it('clears all guest tables', async () => {
    await clearGuestData();
    expect(db.guest_progress.clear).toHaveBeenCalled();
    expect(db.guest_logs.clear).toHaveBeenCalled();
    expect(db.guest_meta.clear).toHaveBeenCalled();
  });
});

describe('readGuestImportPayload', () => {
  it('returns null without a db', async () => {
    mocks.getLocalDb.mockReturnValue(null);
    await expect(readGuestImportPayload()).resolves.toBeNull();
  });

  it('returns null when there is no guest data', async () => {
    await expect(readGuestImportPayload()).resolves.toBeNull();
  });

  it('returns a payload with null settings when only questions exist', async () => {
    db.guest_meta.seed([{ key: 'life_questions', value: { 2: PAST } }]);
    await expect(readGuestImportPayload()).resolves.toEqual({
      cards: [],
      review_logs: [],
      life_questions: [{ id: 2, last_practiced: PAST }],
      settings: null,
    });
  });

  it('collects progress, logs and settings', async () => {
    db.guest_progress.seed([progress('爱|ài', { stability: 1, difficulty: 2, lapses: 0, state: 1 })]);
    db.guest_logs.seed([{ id: 1, card_key: '爱|ài', rating: 3, reviewed_at: PAST, interval: 1, ease_factor: 2.5 }]);
    db.guest_meta.seed([{ key: 'settings', value: { daily_limit: 5 } }]);

    await expect(readGuestImportPayload()).resolves.toEqual({
      cards: [
        {
          card_key: '爱|ài',
          repetition: 1,
          interval: 1,
          ease_factor: 2.5,
          due_date: PAST,
          last_reviewed: PAST,
          status: 'learning',
          stability: 1,
          difficulty: 2,
          lapses: 0,
          state: 1,
        },
      ],
      review_logs: [{ card_key: '爱|ài', rating: 3, reviewed_at: PAST, interval: 1, ease_factor: 2.5 }],
      life_questions: [],
      settings: { daily_limit: 5 },
    });
  });
});

describe('importGuestDataToAccount', () => {
  function stubFetch(impl: () => Promise<unknown>) {
    const fetchMock = vi.fn(impl);
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
  }

  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns true without uploading when there is nothing to import', async () => {
    const fetchMock = stubFetch(async () => ({}));
    await expect(importGuestDataToAccount()).resolves.toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('uploads and clears data on success', async () => {
    db.guest_meta.seed([{ key: 'settings', value: { daily_limit: 5 } }]);
    const fetchMock = stubFetch(async () => ({ ok: true, json: async () => ({ ok: true }) }));

    await expect(importGuestDataToAccount()).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledWith('/api/guest/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: expect.stringContaining('"daily_limit":5'),
    });
    expect(db.guest_meta.clear).toHaveBeenCalled();
  });

  it('returns false when the server responds with an error', async () => {
    db.guest_meta.seed([{ key: 'settings', value: {} }]);
    stubFetch(async () => ({ ok: false, json: async () => ({ ok: true }) }));
    await expect(importGuestDataToAccount()).resolves.toBe(false);
    expect(db.guest_meta.clear).not.toHaveBeenCalled();
  });

  it('returns false when the response is not valid json', async () => {
    db.guest_meta.seed([{ key: 'settings', value: {} }]);
    stubFetch(async () => ({
      ok: true,
      json: async () => {
        throw new Error('bad json');
      },
    }));
    await expect(importGuestDataToAccount()).resolves.toBe(false);
  });

  it('returns false and warns when the request throws', async () => {
    db.guest_meta.seed([{ key: 'settings', value: {} }]);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    stubFetch(async () => {
      throw new Error('offline');
    });
    await expect(importGuestDataToAccount()).resolves.toBe(false);
    expect(warn).toHaveBeenCalledWith('Guest data import failed (kept locally for retry):', expect.any(Error));
    warn.mockRestore();
  });
});
