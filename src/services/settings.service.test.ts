// @vitest-environment node

import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_USER_SETTINGS, UserSettings } from '@/models';
import {
  fetchCurrentUserSettings,
  getUserSettings,
  saveCurrentUserSettings,
  updateUserSettings,
} from '@/services/settings.service';
import {
  findUserSettings,
  saveUserSettings,
} from '@/repositories/sqlite/settings.repository';
import {
  fetchSupabaseUserSettingsRow,
  upsertSupabaseUserSettings,
} from '@/repositories/supabase/progress.repository';

vi.mock('@/repositories/sqlite/settings.repository', () => ({
  findUserSettings: vi.fn(),
  saveUserSettings: vi.fn(),
}));

vi.mock('@/repositories/supabase/progress.repository', () => ({
  fetchSupabaseUserSettingsRow: vi.fn(),
  upsertSupabaseUserSettings: vi.fn(),
}));

const sqliteSettings: UserSettings = { ...DEFAULT_USER_SETTINGS, user_name: 'SQLite User' };

const fullSaved: UserSettings = {
  user_name: 'Saved',
  daily_limit: 30,
  speech_rate: 1.2,
  audio_engine: 'browser',
  auto_play_audio: true,
  has_onboarded: true,
  hsk_level: 4,
  fsrs_retention: 0.85,
};

function row(overrides: Record<string, unknown> = {}) {
  return {
    client: { fake: 'client' },
    userId: 'u1',
    username: 'alice',
    displayName: 'Alice',
    savedSettings: null,
    ...overrides,
  } as never;
}

describe('sync helpers', () => {
  it('getUserSettings reads from SQLite', () => {
    vi.mocked(findUserSettings).mockReturnValue(sqliteSettings);
    expect(getUserSettings()).toBe(sqliteSettings);
  });

  it('updateUserSettings saves to SQLite', () => {
    vi.mocked(saveUserSettings).mockReturnValue(sqliteSettings);
    expect(updateUserSettings({ user_name: 'x' })).toBe(sqliteSettings);
    expect(saveUserSettings).toHaveBeenCalledWith({ user_name: 'x' });
  });
});

describe('fetchCurrentUserSettings', () => {
  it('falls back to SQLite when Supabase has no row', async () => {
    vi.mocked(fetchSupabaseUserSettingsRow).mockResolvedValue(null);
    vi.mocked(findUserSettings).mockReturnValue(sqliteSettings);
    await expect(fetchCurrentUserSettings()).resolves.toBe(sqliteSettings);
  });

  it('uses defaults and display name when no settings are saved', async () => {
    vi.mocked(fetchSupabaseUserSettingsRow).mockResolvedValue(row());
    await expect(fetchCurrentUserSettings()).resolves.toEqual({
      ...DEFAULT_USER_SETTINGS,
      user_name: 'Alice',
      has_onboarded: false,
    });
    expect(findUserSettings).not.toHaveBeenCalled();
  });

  it('falls back to username, then default name', async () => {
    vi.mocked(fetchSupabaseUserSettingsRow).mockResolvedValue(row({ displayName: '' }));
    await expect(fetchCurrentUserSettings()).resolves.toMatchObject({ user_name: 'alice' });

    vi.mocked(fetchSupabaseUserSettingsRow).mockResolvedValue(
      row({ displayName: null, username: '' })
    );
    await expect(fetchCurrentUserSettings()).resolves.toMatchObject({
      user_name: DEFAULT_USER_SETTINGS.user_name,
    });
  });

  it('uses saved settings when present', async () => {
    vi.mocked(fetchSupabaseUserSettingsRow).mockResolvedValue(row({ savedSettings: fullSaved }));
    await expect(fetchCurrentUserSettings()).resolves.toEqual(fullSaved);
  });

  it('fills missing fields of partial saved settings', async () => {
    vi.mocked(fetchSupabaseUserSettingsRow).mockResolvedValue(
      row({ savedSettings: { daily_limit: 0 } })
    );
    await expect(fetchCurrentUserSettings()).resolves.toEqual({
      ...DEFAULT_USER_SETTINGS,
      user_name: 'Alice',
      daily_limit: 0,
    });
  });
});

describe('saveCurrentUserSettings', () => {
  it('falls back to SQLite when Supabase has no row', async () => {
    vi.mocked(fetchSupabaseUserSettingsRow).mockResolvedValue(null);
    vi.mocked(saveUserSettings).mockReturnValue(sqliteSettings);
    await expect(saveCurrentUserSettings({ daily_limit: 5 })).resolves.toBe(sqliteSettings);
    expect(saveUserSettings).toHaveBeenCalledWith({ daily_limit: 5 });
    expect(upsertSupabaseUserSettings).not.toHaveBeenCalled();
  });

  it('merges body over defaults and marks onboarded', async () => {
    vi.mocked(fetchSupabaseUserSettingsRow).mockResolvedValue(row());
    const result = await saveCurrentUserSettings({ hsk_level: 3, has_onboarded: false });
    const expected = {
      ...DEFAULT_USER_SETTINGS,
      user_name: 'Alice',
      hsk_level: 3,
      has_onboarded: true,
    };
    expect(result).toEqual(expected);
    expect(upsertSupabaseUserSettings).toHaveBeenCalledWith('u1', expected, { fake: 'client' });
  });

  it('merges body over saved settings', async () => {
    vi.mocked(fetchSupabaseUserSettingsRow).mockResolvedValue(row({ savedSettings: fullSaved }));
    const result = await saveCurrentUserSettings({ user_name: 'New' });
    expect(result).toEqual({ ...fullSaved, user_name: 'New', has_onboarded: true });
  });

  it('falls back to username, then default name', async () => {
    vi.mocked(fetchSupabaseUserSettingsRow).mockResolvedValue(row({ displayName: null }));
    await expect(saveCurrentUserSettings({})).resolves.toMatchObject({ user_name: 'alice' });

    vi.mocked(fetchSupabaseUserSettingsRow).mockResolvedValue(
      row({ displayName: null, username: null })
    );
    await expect(saveCurrentUserSettings({})).resolves.toMatchObject({
      user_name: DEFAULT_USER_SETTINGS.user_name,
    });
  });
});
