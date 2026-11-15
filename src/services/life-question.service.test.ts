// @vitest-environment node

import { describe, expect, it, vi } from 'vitest';
import {
  fetchLifeQuestions,
  getLifeQuestions,
  recordLifeQuestionPractice,
  submitLifeQuestionPractice,
} from '@/services/life-question.service';
import {
  findAllLifeQuestions,
  markLifeQuestionCompleted,
} from '@/repositories/sqlite/life-question.repository';
import { upsertSupabaseLifeQuestion } from '@/repositories/supabase/progress.repository';
import { loadSupabaseAppData } from '@/services/app-data.service';

vi.mock('@/repositories/sqlite/life-question.repository', () => ({
  findAllLifeQuestions: vi.fn(),
  markLifeQuestionCompleted: vi.fn(),
}));

vi.mock('@/repositories/supabase/progress.repository', () => ({
  upsertSupabaseLifeQuestion: vi.fn(),
}));

vi.mock('@/services/app-data.service', () => ({
  loadSupabaseAppData: vi.fn(),
}));

const sqliteQuestions = [{ id: 1 }] as never;
const supabaseQuestions = [{ id: 2 }] as never;

describe('life question service', () => {
  it('getLifeQuestions reads from SQLite', () => {
    vi.mocked(findAllLifeQuestions).mockReturnValue(sqliteQuestions);
    expect(getLifeQuestions()).toBe(sqliteQuestions);
  });

  it('recordLifeQuestionPractice marks completion in SQLite', () => {
    vi.mocked(markLifeQuestionCompleted).mockReturnValue(true);
    expect(recordLifeQuestionPractice(5)).toBe(true);
    expect(markLifeQuestionCompleted).toHaveBeenCalledWith(5);
  });

  it('fetchLifeQuestions returns Supabase questions when available', async () => {
    vi.mocked(loadSupabaseAppData).mockResolvedValue({ lifeQuestions: supabaseQuestions } as never);
    await expect(fetchLifeQuestions()).resolves.toBe(supabaseQuestions);
    expect(loadSupabaseAppData).toHaveBeenCalledWith({ includeQuestions: true });
    expect(findAllLifeQuestions).not.toHaveBeenCalled();
  });

  it('fetchLifeQuestions falls back to SQLite without Supabase data', async () => {
    vi.mocked(loadSupabaseAppData).mockResolvedValue(null as never);
    vi.mocked(findAllLifeQuestions).mockReturnValue(sqliteQuestions);
    await expect(fetchLifeQuestions()).resolves.toBe(sqliteQuestions);
  });

  it('fetchLifeQuestions falls back to SQLite when questions are missing', async () => {
    vi.mocked(loadSupabaseAppData).mockResolvedValue({} as never);
    vi.mocked(findAllLifeQuestions).mockReturnValue(sqliteQuestions);
    await expect(fetchLifeQuestions()).resolves.toBe(sqliteQuestions);
  });

  it('submitLifeQuestionPractice returns true when synced to Supabase', async () => {
    vi.mocked(upsertSupabaseLifeQuestion).mockResolvedValue(true);
    await expect(submitLifeQuestionPractice(9)).resolves.toBe(true);
    expect(upsertSupabaseLifeQuestion).toHaveBeenCalledWith(9);
    expect(markLifeQuestionCompleted).not.toHaveBeenCalled();
  });

  it('submitLifeQuestionPractice falls back to SQLite when not synced', async () => {
    vi.mocked(upsertSupabaseLifeQuestion).mockResolvedValue(false);
    vi.mocked(markLifeQuestionCompleted).mockReturnValue(false);
    await expect(submitLifeQuestionPractice(9)).resolves.toBe(false);
    expect(markLifeQuestionCompleted).toHaveBeenCalledWith(9);
  });
});
