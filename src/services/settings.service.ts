import { UserSettings, DEFAULT_USER_SETTINGS } from '@/models';
import {
  findUserSettings,
  saveUserSettings,
} from '@/repositories/sqlite/settings.repository';
import {
  fetchSupabaseUserSettingsRow,
  upsertSupabaseUserSettings,
} from '@/repositories/supabase/progress.repository';

export function getUserSettings(): UserSettings {
  return findUserSettings();
}

export function updateUserSettings(settings: Partial<UserSettings>): UserSettings {
  return saveUserSettings(settings);
}

export async function fetchCurrentUserSettings(): Promise<UserSettings> {
  const sbRow = await fetchSupabaseUserSettingsRow();
  if (sbRow) {
    const { username, displayName, savedSettings } = sbRow;
    const defaultName = displayName || username || DEFAULT_USER_SETTINGS.user_name;
    return {
      user_name: savedSettings?.user_name || defaultName,
      daily_limit: savedSettings?.daily_limit ?? DEFAULT_USER_SETTINGS.daily_limit,
      speech_rate: savedSettings?.speech_rate ?? DEFAULT_USER_SETTINGS.speech_rate,
      audio_engine: savedSettings?.audio_engine || DEFAULT_USER_SETTINGS.audio_engine,
      auto_play_audio: Boolean(savedSettings?.auto_play_audio),
      has_onboarded: Boolean(savedSettings?.has_onboarded ?? false),
      hsk_level: savedSettings?.hsk_level ?? DEFAULT_USER_SETTINGS.hsk_level,
      fsrs_retention: savedSettings?.fsrs_retention ?? DEFAULT_USER_SETTINGS.fsrs_retention,
    };
  }

  return findUserSettings();
}

export async function saveCurrentUserSettings(body: Partial<UserSettings>): Promise<UserSettings> {
  const sbRow = await fetchSupabaseUserSettingsRow();
  if (sbRow) {
    const { client, userId, username, displayName, savedSettings } = sbRow;
    const defaultName = displayName || username || DEFAULT_USER_SETTINGS.user_name;
    const baseSettings: UserSettings = {
      user_name: savedSettings?.user_name || defaultName,
      daily_limit: savedSettings?.daily_limit ?? DEFAULT_USER_SETTINGS.daily_limit,
      speech_rate: savedSettings?.speech_rate ?? DEFAULT_USER_SETTINGS.speech_rate,
      audio_engine: savedSettings?.audio_engine || DEFAULT_USER_SETTINGS.audio_engine,
      auto_play_audio: Boolean(savedSettings?.auto_play_audio),
      has_onboarded: Boolean(savedSettings?.has_onboarded ?? false),
      hsk_level: savedSettings?.hsk_level ?? DEFAULT_USER_SETTINGS.hsk_level,
      fsrs_retention: savedSettings?.fsrs_retention ?? DEFAULT_USER_SETTINGS.fsrs_retention,
    };

    const mergedSettings: UserSettings = {
      ...baseSettings,
      ...body,
      has_onboarded: true,
    };

    await upsertSupabaseUserSettings(userId, mergedSettings, client);
    return mergedSettings;
  }

  return saveUserSettings(body);
}

