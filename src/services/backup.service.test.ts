// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import path from 'path';
import fs from 'fs';
import { BACKUP_FORMAT, BACKUP_VERSION, Card, LifeQuestion, ProgressBackup, ReviewLog, UserSettings } from '@/models';
import {
  findAllCards,
  findAllReviewLogs,
  importCardsAndLogs,
} from '@/repositories/sqlite/card.repository';
import {
  findAllLifeQuestions,
  importLifeQuestions,
} from '@/repositories/sqlite/life-question.repository';
import { findUserSettings, saveUserSettings } from '@/repositories/sqlite/settings.repository';
import { resetSqliteAndMemory } from '@/repositories/sqlite/connection';
import { deleteSupabaseUserProgress } from '@/repositories/supabase/progress.repository';
import {
  exportProgress,
  importProgress,
  resetDatabase,
  resetUserOrLocalProgress,
} from '@/services/backup.service';

vi.mock('fs', () => ({
  default: { mkdirSync: vi.fn(), writeFileSync: vi.fn() },
}));
vi.mock('@/repositories/sqlite/card.repository', () => ({
  findAllCards: vi.fn(),
  findAllReviewLogs: vi.fn(),
  importCardsAndLogs: vi.fn(),
}));
vi.mock('@/repositories/sqlite/life-question.repository', () => ({
  findAllLifeQuestions: vi.fn(),
  importLifeQuestions: vi.fn(),
}));
vi.mock('@/repositories/sqlite/settings.repository', () => ({
  findUserSettings: vi.fn(),
  saveUserSettings: vi.fn(),
}));
vi.mock('@/repositories/sqlite/connection', () => ({ resetSqliteAndMemory: vi.fn() }));
vi.mock('@/repositories/supabase/progress.repository', () => ({
  deleteSupabaseUserProgress: vi.fn(),
}));

const NOW = new Date('2026-11-15T12:00:00.000Z');

const settings: UserSettings = {
  user_name: 'Tester',
  daily_limit: 10,
  speech_rate: 1,
  audio_engine: 'online',
  auto_play_audio: false,
  has_onboarded: true,
  hsk_level: 1,
};

function card(overrides: Partial<Card>): Card {
  return {
    id: 1,
    hanzi: 'A',
    pinyin: 'a',
    meaning: 'm',
    category: 'c',
    category_name: 'C',
    repetition: 0,
    interval: 0,
    ease_factor: 2.5,
    due_date: '2026-11-01T00:00:00.000Z',
    last_reviewed: null,
    status: 'new',
    ...overrides,
  };
}

function question(overrides: Partial<LifeQuestion>): LifeQuestion {
  return {
    id: 1,
    topic: 't',
    topic_name: 'T',
    situation: 's',
    question_hanzi: 'q',
    question_pinyin: 'q',
    question_meaning: 'q',
    answer_hanzi: 'a',
    answer_pinyin: 'a',
    answer_meaning: 'a',
    options: [],
    explanation: 'e',
    completed: false,
    last_practiced: null,
    ...overrides,
  };
}

const cards: Card[] = [
  card({
    id: 1,
    hanzi: 'A',
    pinyin: 'a',
    status: 'learning',
    repetition: 1,
    interval: 2,
    ease_factor: 2.3,
    last_reviewed: '2026-11-10T00:00:00.000Z',
    stability: 1.2,
    difficulty: 5,
    lapses: 1,
    state: 2,
  }),
  card({ id: 2, hanzi: 'B', pinyin: 'b', status: 'new', last_reviewed: '2026-11-11T00:00:00.000Z' }),
  card({ id: 3, hanzi: 'C', pinyin: 'c', status: 'new', last_reviewed: null }),
];

const logs: ReviewLog[] = [
  {
    id: 1,
    card_id: 1,
    rating: 3,
    reviewed_at: '2026-11-10T00:00:00.000Z',
    interval: 2,
    ease_factor: 2.3,
    stability: 1.2,
    difficulty: 5,
  },
  { id: 2, card_id: 2, rating: 1, reviewed_at: '2026-11-11T00:00:00.000Z', interval: 0, ease_factor: 2.5 },
  { id: 3, card_id: 99, rating: 4, reviewed_at: '2026-11-12T00:00:00.000Z', interval: 1, ease_factor: 2.5 },
];

const questions: LifeQuestion[] = [
  question({ id: 1, completed: true, last_practiced: null }),
  question({ id: 2, completed: false, last_practiced: '2026-11-09T00:00:00.000Z' }),
  question({ id: 3, completed: false, last_practiced: null }),
];

function backup(overrides: Partial<ProgressBackup> = {}): ProgressBackup {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exported_at: NOW.toISOString(),
    settings,
    cards: [],
    review_logs: [],
    life_questions: [],
    ...overrides,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  vi.mocked(findAllCards).mockReturnValue(cards);
  vi.mocked(findAllReviewLogs).mockReturnValue(logs);
  vi.mocked(findAllLifeQuestions).mockReturnValue(questions);
  vi.mocked(findUserSettings).mockReturnValue(settings);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('exportProgress', () => {
  it('exports only learner-produced progress', () => {
    const result = exportProgress();

    expect(result.format).toBe(BACKUP_FORMAT);
    expect(result.version).toBe(BACKUP_VERSION);
    expect(result.exported_at).toBe(NOW.toISOString());
    expect(result.settings).toBe(settings);
    expect(result.cards).toEqual([
      {
        key: 'A|a',
        hanzi: 'A',
        pinyin: 'a',
        repetition: 1,
        interval: 2,
        ease_factor: 2.3,
        due_date: '2026-11-01T00:00:00.000Z',
        last_reviewed: '2026-11-10T00:00:00.000Z',
        status: 'learning',
        stability: 1.2,
        difficulty: 5,
        lapses: 1,
        state: 2,
      },
      {
        key: 'B|b',
        hanzi: 'B',
        pinyin: 'b',
        repetition: 0,
        interval: 0,
        ease_factor: 2.5,
        due_date: '2026-11-01T00:00:00.000Z',
        last_reviewed: '2026-11-11T00:00:00.000Z',
        status: 'new',
        stability: 0,
        difficulty: 0,
        lapses: 0,
        state: 0,
      },
    ]);
    expect(result.review_logs).toEqual([
      {
        card_key: 'A|a',
        rating: 3,
        reviewed_at: '2026-11-10T00:00:00.000Z',
        interval: 2,
        ease_factor: 2.3,
        stability: 1.2,
        difficulty: 5,
      },
      {
        card_key: 'B|b',
        rating: 1,
        reviewed_at: '2026-11-11T00:00:00.000Z',
        interval: 0,
        ease_factor: 2.5,
        stability: 0,
        difficulty: 0,
      },
    ]);
    expect(result.life_questions).toEqual([
      { id: 1, completed: true, last_practiced: null },
      { id: 2, completed: false, last_practiced: '2026-11-09T00:00:00.000Z' },
    ]);
  });
});

describe('importProgress', () => {
  it.each([
    ['null backup', null],
    ['wrong format', { ...backup(), format: 'other' }],
    ['non-array cards', { ...backup(), cards: 'nope' }],
  ])('rejects an invalid backup (%s)', (_label, value) => {
    expect(() => importProgress(value as unknown as ProgressBackup)).toThrow('Invalid backup file');
  });

  it('rejects a backup from a newer version', () => {
    expect(() => importProgress(backup({ version: BACKUP_VERSION + 1 }))).toThrow(
      `Backup version ${BACKUP_VERSION + 1} is newer than supported (${BACKUP_VERSION})`
    );
  });

  it('imports cards, logs, questions and settings', () => {
    vi.mocked(importCardsAndLogs).mockReturnValue({ cards: 2, review_logs: 3, skipped_cards: 1 });
    vi.mocked(importLifeQuestions).mockReturnValue(4);
    const data = backup({
      cards: [{ key: 'A|a', hanzi: 'A', pinyin: 'a', repetition: 1, interval: 1, ease_factor: 2.5, due_date: 'd', last_reviewed: null, status: 'learning' }],
      review_logs: [{ card_key: 'A|a', rating: 3, reviewed_at: 'r', interval: 1, ease_factor: 2.5 }],
      life_questions: [{ id: 1, completed: true, last_practiced: null }],
    });

    const result = importProgress(data);

    expect(result).toEqual({ cards: 2, review_logs: 3, life_questions: 4, skipped_cards: 1 });
    expect(importCardsAndLogs).toHaveBeenCalledWith(
      new Map([
        ['A|a', 1],
        ['B|b', 2],
        ['C|c', 3],
      ]),
      data.cards,
      data.review_logs
    );
    expect(importLifeQuestions).toHaveBeenCalledWith(data.life_questions);
    expect(saveUserSettings).toHaveBeenCalledWith(settings);
  });

  it('defaults missing logs and questions and skips missing settings', () => {
    vi.mocked(importCardsAndLogs).mockReturnValue({ cards: 0, review_logs: 0, skipped_cards: 0 });
    vi.mocked(importLifeQuestions).mockReturnValue(0);
    const data = {
      ...backup(),
      settings: undefined,
      review_logs: undefined,
      life_questions: undefined,
    } as unknown as ProgressBackup;

    const result = importProgress(data);

    expect(result).toEqual({ cards: 0, review_logs: 0, life_questions: 0, skipped_cards: 0 });
    expect(importCardsAndLogs).toHaveBeenCalledWith(expect.any(Map), [], []);
    expect(importLifeQuestions).toHaveBeenCalledWith([]);
    expect(saveUserSettings).not.toHaveBeenCalled();
  });
});

describe('resetDatabase', () => {
  it('writes a pre-reset backup when there is progress', () => {
    resetDatabase();

    const dir = path.join(process.cwd(), 'data', 'backups');
    expect(fs.mkdirSync).toHaveBeenCalledWith(dir, { recursive: true });
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      path.join(dir, `progress-before-reset-${NOW.getTime()}.json`),
      expect.stringContaining('"format": "chinese-flashcard-backup"')
    );
    expect(resetSqliteAndMemory).toHaveBeenCalledTimes(1);
  });

  it('writes a backup when only review logs exist', () => {
    vi.mocked(findAllCards).mockReturnValue([card({ id: 7, hanzi: 'Z', pinyin: 'z' })]);
    vi.mocked(findAllReviewLogs).mockReturnValue([
      { id: 1, card_id: 7, rating: 3, reviewed_at: 'r', interval: 1, ease_factor: 2.5 },
    ]);

    resetDatabase();

    expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
  });

  it('skips the backup when there is no progress', () => {
    vi.mocked(findAllCards).mockReturnValue([cards[2]]);
    vi.mocked(findAllReviewLogs).mockReturnValue([]);

    resetDatabase();

    expect(fs.mkdirSync).not.toHaveBeenCalled();
    expect(fs.writeFileSync).not.toHaveBeenCalled();
    expect(resetSqliteAndMemory).toHaveBeenCalledTimes(1);
  });

  it('still resets when the backup cannot be written', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.mocked(fs.writeFileSync).mockImplementationOnce(() => {
      throw new Error('disk full');
    });

    resetDatabase();

    expect(warn).toHaveBeenCalledWith('Could not write pre-reset backup:', expect.any(Error));
    expect(resetSqliteAndMemory).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });
});

describe('resetUserOrLocalProgress', () => {
  it('resets the Supabase account progress when possible', async () => {
    vi.mocked(deleteSupabaseUserProgress).mockResolvedValue(true);

    await expect(resetUserOrLocalProgress()).resolves.toEqual({
      message: 'Đã khôi phục tiến độ học của tài khoản về ban đầu.',
    });
    expect(resetSqliteAndMemory).not.toHaveBeenCalled();
  });

  it('falls back to resetting the local database', async () => {
    vi.mocked(deleteSupabaseUserProgress).mockResolvedValue(false);

    await expect(resetUserOrLocalProgress()).resolves.toEqual({
      message: 'Database reset and re-seeded successfully',
    });
    expect(resetSqliteAndMemory).toHaveBeenCalledTimes(1);
  });
});
