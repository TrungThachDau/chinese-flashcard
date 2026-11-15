// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { connection } from 'next/server';
import { isSupabaseConfigured } from '@/repositories/supabase/server.client';
import { fetchSupabaseAppRawData } from '@/repositories/supabase/progress.repository';
import { findAllCards, countCards, findDueCards } from '@/repositories/sqlite/card.repository';
import { findAllLifeQuestions } from '@/repositories/sqlite/life-question.repository';
import { findUserSettings } from '@/repositories/sqlite/settings.repository';
import { computeSqliteStudyStats, computeStreak } from '@/repositories/sqlite/stats.repository';
import { loadServerAppData, loadSupabaseAppData } from '@/services/app-data.service';

vi.mock('next/server', () => ({ connection: vi.fn() }));

vi.mock('@/models/data/hsk30Data', () => ({
  HSK30_LEVEL1_CARDS: [
    { id: '1', hanzi: 'A', pinyin: 'a', meaning: 'a', category: 'greetings', category_name: 'G', hsk: 2, tags: ['T'] },
    { id: '2', hanzi: 'B', pinyin: 'b', meaning: 'b', category: 'greetings', category_name: 'G' },
    { id: '3', hanzi: 'C', pinyin: 'c', meaning: 'c', category: 'other', category_name: 'O' },
    { id: '4', hanzi: 'D', pinyin: 'd', meaning: 'd', category: 'other', category_name: 'O' },
    { id: '5', hanzi: 'E', pinyin: 'e', meaning: 'e', category: 'other', category_name: 'O' },
    { id: '6', hanzi: 'F', pinyin: 'f', meaning: 'f', category: 'other', category_name: 'O' },
    { id: '7', hanzi: 'G', pinyin: 'g', meaning: 'g', category: 'greetings', category_name: 'G' },
  ],
}));

vi.mock('@/models/data/initialData', () => ({
  CATEGORIES_CONFIG: [
    { id: 'greetings', name: 'Greetings', icon: 'g', color: 'c1' },
    { id: 'other', name: 'Other', icon: 'o', color: 'c2' },
  ],
  INITIAL_LIFE_QUESTIONS: [
    { id: 1, topic: 't', topic_name: 'T', situation: 's', question_hanzi: 'q', question_pinyin: 'q', question_meaning: 'q', answer_hanzi: 'a', answer_pinyin: 'a', answer_meaning: 'a', options: ['x', 'y'], explanation: 'e', completed: false, last_practiced: null },
    { id: 2, topic: 't', topic_name: 'T', situation: 's', question_hanzi: 'q', question_pinyin: 'q', question_meaning: 'q', answer_hanzi: 'a', answer_pinyin: 'a', answer_meaning: 'a', options: ['z'], explanation: 'e', completed: false, last_practiced: null },
    { id: 3, topic: 't', topic_name: 'T', situation: 's', question_hanzi: 'q', question_pinyin: 'q', question_meaning: 'q', answer_hanzi: 'a', answer_pinyin: 'a', answer_meaning: 'a', options: [], explanation: 'e', completed: false, last_practiced: null },
  ],
}));

vi.mock('@/repositories/supabase/server.client', () => ({ isSupabaseConfigured: vi.fn() }));
vi.mock('@/repositories/supabase/progress.repository', () => ({ fetchSupabaseAppRawData: vi.fn() }));
vi.mock('@/repositories/sqlite/card.repository', () => ({
  findAllCards: vi.fn(),
  countCards: vi.fn(),
  findDueCards: vi.fn(),
}));
vi.mock('@/repositories/sqlite/life-question.repository', () => ({ findAllLifeQuestions: vi.fn() }));
vi.mock('@/repositories/sqlite/settings.repository', () => ({ findUserSettings: vi.fn() }));
vi.mock('@/repositories/sqlite/stats.repository', () => ({
  computeSqliteStudyStats: vi.fn(),
  computeStreak: vi.fn(),
}));

const NOW = new Date('2026-11-15T12:00:00.000Z');
const PAST = '2026-11-01T00:00:00.000Z';
const OLDER = '2026-10-01T00:00:00.000Z';
const FUTURE = '2026-12-01T00:00:00.000Z';

type RawData = NonNullable<Awaited<ReturnType<typeof fetchSupabaseAppRawData>>>;

function rawData(overrides: Record<string, unknown> = {}): RawData {
  return {
    username: 'user1',
    displayName: 'Display',
    savedSettings: undefined,
    cardProgressRows: [],
    reviewLogRows: [],
    questionProgressRows: [],
    ...overrides,
  } as unknown as RawData;
}

describe('loadSupabaseAppData', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    vi.mocked(computeStreak).mockReturnValue(4);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null when not logged in and guests are not allowed', async () => {
    vi.mocked(fetchSupabaseAppRawData).mockResolvedValue(null);

    await expect(loadSupabaseAppData()).resolves.toBeNull();
    expect(fetchSupabaseAppRawData).toHaveBeenCalledWith(false);
  });

  it('returns default guest data when guests are allowed', async () => {
    vi.mocked(fetchSupabaseAppRawData).mockResolvedValue(null);

    const result = await loadSupabaseAppData({}, true);

    expect(result).not.toBeNull();
    expect(result!.isGuest).toBe(true);
    expect(result!.userSettings).toEqual({
      user_name: 'Học viên',
      daily_limit: 15,
      speech_rate: 0.85,
      audio_engine: 'online',
      auto_play_audio: false,
      has_onboarded: false,
      hsk_level: 1,
      fsrs_retention: 0.9,
    });
    expect(result!.allCards).toEqual([]);
    expect(result!.lifeQuestions).toEqual([]);
    expect(result!.totalCards).toBe(7);
    expect(result!.dueCards).toHaveLength(7);
    expect(result!.dueCards[0]).toMatchObject({ id: 1, hsk: 2, tags: ['T'], status: 'new' });
    expect(result!.dueCards[1]).toMatchObject({ id: 2, hsk: 1, tags: ['HSK 1'] });
    expect(result!.studyStats).toMatchObject({
      total_cards: 7,
      new_cards: 7,
      due_today: 7,
      retention_rate: 100,
      total_reviews: 0,
      today_reviewed_count: 0,
      streak_days: 4,
    });
    expect(computeStreak).toHaveBeenCalledWith([], '2026-11-15');
  });

  it('merges progress, settings, review logs and questions', async () => {
    vi.mocked(fetchSupabaseAppRawData).mockResolvedValue(
      rawData({
        savedSettings: {
          user_name: 'Saved',
          daily_limit: 4,
          speech_rate: 1,
          audio_engine: 'browser',
          auto_play_audio: 1,
          has_onboarded: true,
          hsk_level: 3,
          fsrs_retention: 0.8,
        },
        cardProgressRows: [
          {
            card_key: 'A|a',
            repetition: 2,
            interval: 3,
            ease_factor: 2.1,
            due_date: PAST,
            last_reviewed: OLDER,
            status: 'learning',
            stability: 1.5,
            difficulty: 4,
            lapses: 1,
            state: 2,
          },
          { card_key: 'B|b' },
          { card_key: 'C|c', status: 'mastered', due_date: FUTURE },
          { card_key: 'D|d', status: 'reviewing', due_date: PAST },
          { card_key: 'E|e', status: 'weird', due_date: OLDER },
          { card_key: 'F|f', status: 'learning', due_date: OLDER },
        ],
        reviewLogRows: [
          { rating: 4, reviewed_at: NOW.toISOString() },
          { rating: 1, reviewed_at: PAST },
          { rating: 3, reviewed_at: 123 },
        ],
        questionProgressRows: [
          { question_id: 1, completed: 1, last_practiced: PAST },
          { question_id: 2, completed: 0, last_practiced: null },
        ],
      })
    );

    const result = await loadSupabaseAppData(
      { includeAllCards: true, includeQuestions: true, cardsLimit: 3 },
      false
    );

    expect(fetchSupabaseAppRawData).toHaveBeenCalledWith(true);
    expect(result!.isGuest).toBe(false);
    expect(result!.userSettings).toEqual({
      user_name: 'Saved',
      daily_limit: 4,
      speech_rate: 1,
      audio_engine: 'browser',
      auto_play_audio: true,
      has_onboarded: true,
      hsk_level: 3,
      fsrs_retention: 0.8,
    });

    expect(result!.allCards).toHaveLength(3);
    expect(result!.allCards[0]).toMatchObject({
      repetition: 2,
      interval: 3,
      ease_factor: 2.1,
      due_date: PAST,
      last_reviewed: OLDER,
      status: 'learning',
      stability: 1.5,
      difficulty: 4,
      lapses: 1,
      state: 2,
    });
    expect(result!.allCards[1]).toMatchObject({
      repetition: 0,
      interval: 0,
      ease_factor: 2.5,
      due_date: NOW.toISOString(),
      last_reviewed: null,
      status: 'new',
      stability: 0,
      difficulty: 0,
      lapses: 0,
      state: 0,
    });

    // learning (sorted by due date), then new, then reviewing, limited to daily_limit
    expect(result!.dueCards.map((c) => c.hanzi)).toEqual(['F', 'A', 'B', 'G']);

    expect(result!.studyStats).toMatchObject({
      total_cards: 7,
      mastered_cards: 1,
      learning_cards: 2,
      reviewing_cards: 1,
      new_cards: 3,
      due_today: 6,
      total_reviews: 3,
      retention_rate: 67,
      today_reviewed_count: 1,
    });
    expect(computeStreak).toHaveBeenCalledWith(['2026-11-15', '2026-11-01'], '2026-11-15');

    const [greetings, other] = result!.studyStats.categories;
    expect(greetings).toEqual({
      id: 'greetings',
      name: 'Greetings',
      icon: 'g',
      color: 'c1',
      total: 3,
      new_count: 2,
      learning_count: 1,
      reviewing_count: 3,
      mastered_count: 0,
    });
    expect(other).toMatchObject({ total: 4, new_count: 0, learning_count: 1, mastered_count: 1, reviewing_count: 3 });

    expect(result!.lifeQuestions).toHaveLength(3);
    expect(result!.lifeQuestions[0]).toMatchObject({ id: 1, completed: true, last_practiced: PAST, options: ['x', 'y'] });
    expect(result!.lifeQuestions[1]).toMatchObject({ id: 2, completed: false, last_practiced: null });
    expect(result!.lifeQuestions[2]).toMatchObject({ id: 3, completed: false, last_practiced: null });
  });

  it('falls back to username and then default name for user_name', async () => {
    vi.mocked(fetchSupabaseAppRawData).mockResolvedValueOnce(rawData({ displayName: null }));
    const byUsername = await loadSupabaseAppData();
    expect(byUsername!.userSettings.user_name).toBe('user1');

    vi.mocked(fetchSupabaseAppRawData).mockResolvedValueOnce(rawData());
    const byDisplay = await loadSupabaseAppData();
    expect(byDisplay!.userSettings.user_name).toBe('Display');

    vi.mocked(fetchSupabaseAppRawData).mockResolvedValueOnce(
      rawData({ displayName: null, username: null, savedSettings: { user_name: '' } })
    );
    const byDefault = await loadSupabaseAppData();
    expect(byDefault!.userSettings.user_name).toBe('Học viên');
  });
});

describe('loadServerAppData', () => {
  const settings = {
    user_name: 'Local',
    daily_limit: 7,
    speech_rate: 0.85,
    audio_engine: 'online' as const,
    auto_play_audio: false,
    has_onboarded: true,
    hsk_level: 1,
  };
  const stats = { total_cards: 1 } as ReturnType<typeof computeSqliteStudyStats>;
  const cards = [{ id: 1 }] as ReturnType<typeof findAllCards>;
  const due = [{ id: 2 }] as ReturnType<typeof findDueCards>;
  const questions = [{ id: 3 }] as ReturnType<typeof findAllLifeQuestions>;

  beforeEach(() => {
    vi.mocked(connection).mockResolvedValue(undefined);
    vi.mocked(isSupabaseConfigured).mockReturnValue(false);
    vi.mocked(findUserSettings).mockReturnValue(settings);
    vi.mocked(findDueCards).mockReturnValue(due);
    vi.mocked(countCards).mockReturnValue(42);
    vi.mocked(findAllCards).mockReturnValue(cards);
    vi.mocked(findAllLifeQuestions).mockReturnValue(questions);
    vi.mocked(computeSqliteStudyStats).mockReturnValue(stats);
  });

  it('returns Supabase data when configured', async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    vi.mocked(fetchSupabaseAppRawData).mockResolvedValue(rawData());

    const result = await loadServerAppData();

    expect(result.isGuest).toBe(false);
    expect(result.userSettings.user_name).toBe('Display');
    expect(findUserSettings).not.toHaveBeenCalled();
  });

  it('falls back to SQLite when Supabase throws and ignores connection errors', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.mocked(connection).mockRejectedValue(new Error('no request'));
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    vi.mocked(fetchSupabaseAppRawData).mockRejectedValue(new Error('boom'));

    const result = await loadServerAppData();

    expect(warn).toHaveBeenCalledWith(
      'Supabase SSR load error, falling back to local database:',
      expect.any(Error)
    );
    expect(result).toEqual({
      userSettings: settings,
      dueCards: due,
      allCards: [],
      totalCards: 0,
      lifeQuestions: [],
      studyStats: stats,
      isGuest: false,
    });
    warn.mockRestore();
  });

  it('loads all optional data from SQLite', async () => {
    const result = await loadServerAppData({ includeAllCards: true, includeQuestions: true, cardsLimit: 5 });

    expect(findDueCards).toHaveBeenCalledWith(7);
    expect(findAllCards).toHaveBeenCalledWith({ limit: 5, offset: 0 });
    expect(result).toEqual({
      userSettings: settings,
      dueCards: due,
      allCards: cards,
      totalCards: 42,
      lifeQuestions: questions,
      studyStats: stats,
      isGuest: false,
    });
  });

  it('retries with defaults when the SQLite load fails', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(findDueCards).mockImplementationOnce(() => {
      throw new Error('db');
    });

    const result = await loadServerAppData({ includeAllCards: true, includeQuestions: true });

    expect(error).toHaveBeenCalledWith('loadServerAppData error:', expect.any(Error));
    expect(findDueCards).toHaveBeenLastCalledWith(15);
    expect(findAllCards).toHaveBeenCalledWith({ limit: 30, offset: 0 });
    expect(result).toEqual({
      userSettings: settings,
      dueCards: due,
      allCards: cards,
      totalCards: 42,
      lifeQuestions: questions,
      studyStats: stats,
      isGuest: false,
    });
    error.mockRestore();
  });

  it('retries with defaults without optional data', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(computeSqliteStudyStats).mockImplementationOnce(() => {
      throw new Error('db');
    });

    const result = await loadServerAppData();

    expect(result.allCards).toEqual([]);
    expect(result.totalCards).toBe(0);
    expect(result.lifeQuestions).toEqual([]);
    expect(countCards).not.toHaveBeenCalled();
    error.mockRestore();
  });
});
