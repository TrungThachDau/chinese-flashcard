// @vitest-environment node

import { describe, expect, it, vi } from 'vitest';
import { fetchStudyStats, getStudyStats } from '@/services/stats.service';
import { computeSqliteStudyStats } from '@/repositories/sqlite/stats.repository';
import { isSupabaseConfigured } from '@/repositories/supabase/server.client';
import { loadSupabaseAppData } from '@/services/app-data.service';

vi.mock('@/repositories/sqlite/stats.repository', () => ({
  computeSqliteStudyStats: vi.fn(),
}));

vi.mock('@/repositories/supabase/server.client', () => ({
  isSupabaseConfigured: vi.fn(),
}));

vi.mock('@/services/app-data.service', () => ({
  loadSupabaseAppData: vi.fn(),
}));

const sqliteStats = { source: 'sqlite' } as never;
const supabaseStats = { source: 'supabase' } as never;

describe('getStudyStats', () => {
  it('computes SQLite stats with timezone offset', () => {
    vi.mocked(computeSqliteStudyStats).mockReturnValue(sqliteStats);
    expect(getStudyStats(-420)).toBe(sqliteStats);
    expect(computeSqliteStudyStats).toHaveBeenCalledWith(-420);
  });
});

describe('fetchStudyStats', () => {
  it('uses SQLite when Supabase is not configured', async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(false);
    vi.mocked(computeSqliteStudyStats).mockReturnValue(sqliteStats);
    await expect(fetchStudyStats(60)).resolves.toBe(sqliteStats);
    expect(loadSupabaseAppData).not.toHaveBeenCalled();
    expect(computeSqliteStudyStats).toHaveBeenCalledWith(60);
  });

  it('returns Supabase stats when available', async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    vi.mocked(loadSupabaseAppData).mockResolvedValue({ studyStats: supabaseStats } as never);
    await expect(fetchStudyStats()).resolves.toBe(supabaseStats);
    expect(computeSqliteStudyStats).not.toHaveBeenCalled();
  });

  it('falls back to SQLite when Supabase returns no data', async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    vi.mocked(loadSupabaseAppData).mockResolvedValue(null as never);
    vi.mocked(computeSqliteStudyStats).mockReturnValue(sqliteStats);
    await expect(fetchStudyStats(0)).resolves.toBe(sqliteStats);
  });

  it('falls back to SQLite when Supabase data has no stats', async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    vi.mocked(loadSupabaseAppData).mockResolvedValue({} as never);
    vi.mocked(computeSqliteStudyStats).mockReturnValue(sqliteStats);
    await expect(fetchStudyStats()).resolves.toBe(sqliteStats);
  });

  it('logs and falls back to SQLite when Supabase throws', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const err = new Error('network');
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    vi.mocked(loadSupabaseAppData).mockRejectedValue(err);
    vi.mocked(computeSqliteStudyStats).mockReturnValue(sqliteStats);
    await expect(fetchStudyStats(30)).resolves.toBe(sqliteStats);
    expect(warn).toHaveBeenCalledWith('Supabase stats fetch error, falling back to SQLite:', err);
    warn.mockRestore();
  });
});
