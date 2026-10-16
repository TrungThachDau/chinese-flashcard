import { UserSettings } from '@/models';
import { getDatabase, getMemoryStore, toPlain } from './connection';

export function findUserSettings(): UserSettings {
  const db = getDatabase();
  if (db) {
    try {
      const rows = db.prepare('SELECT key, value FROM user_settings').all() as Array<{ key: string; value: string }>;
      const map: Record<string, string> = {};
      for (const r of rows) {
        map[r.key] = r.value;
      }
      const parsedDailyLimit = parseInt(map.daily_limit || '15', 10);
      const parsedHskLevel = parseInt(map.hsk_level || '1', 10);
      const parsedSpeechRate = parseFloat(map.speech_rate || '0.85');
      const parsedFsrsRetention = parseFloat(map.fsrs_retention || '0.9');

      return toPlain({
        user_name: map.user_name || 'Học viên',
        daily_limit: Number.isNaN(parsedDailyLimit) || parsedDailyLimit < 5 ? 15 : parsedDailyLimit,
        speech_rate: Number.isNaN(parsedSpeechRate) ? 0.85 : parsedSpeechRate,
        audio_engine: (map.audio_engine === 'browser' ? 'browser' : 'online') as 'online' | 'browser',
        auto_play_audio: map.auto_play_audio === 'true',
        has_onboarded: map.has_onboarded === 'true',
        hsk_level: Number.isNaN(parsedHskLevel) ? 1 : parsedHskLevel,
        fsrs_retention: Number.isNaN(parsedFsrsRetention) ? 0.9 : Math.min(0.97, Math.max(0.75, parsedFsrsRetention)),
      });
    } catch (err) {
      console.warn('SQLite findUserSettings error, falling back to memory store:', err);
    }
  }

  const store = getMemoryStore();
  return toPlain(store.userSettings);
}

export function saveUserSettings(settings: Partial<UserSettings>): UserSettings {
  const store = getMemoryStore();
  store.userSettings = {
    ...store.userSettings,
    ...settings,
    daily_limit: settings.daily_limit !== undefined ? Math.max(5, settings.daily_limit) : store.userSettings.daily_limit,
    user_name: settings.user_name !== undefined ? settings.user_name.trim() || 'Học viên' : store.userSettings.user_name,
    fsrs_retention: settings.fsrs_retention !== undefined ? Math.min(0.97, Math.max(0.75, settings.fsrs_retention)) : store.userSettings.fsrs_retention,
  };

  const db = getDatabase();
  if (db) {
    try {
      const updateStmt = db.prepare('INSERT OR REPLACE INTO user_settings (key, value) VALUES (?, ?)');

      if (settings.user_name !== undefined) updateStmt.run('user_name', settings.user_name.trim() || 'Học viên');
      if (settings.daily_limit !== undefined) updateStmt.run('daily_limit', Math.max(5, settings.daily_limit).toString());
      if (settings.speech_rate !== undefined) updateStmt.run('speech_rate', settings.speech_rate.toString());
      if (settings.audio_engine !== undefined) updateStmt.run('audio_engine', settings.audio_engine);
      if (settings.auto_play_audio !== undefined) updateStmt.run('auto_play_audio', settings.auto_play_audio ? 'true' : 'false');
      if (settings.has_onboarded !== undefined) updateStmt.run('has_onboarded', settings.has_onboarded ? 'true' : 'false');
      if (settings.hsk_level !== undefined) updateStmt.run('hsk_level', settings.hsk_level.toString());
      if (settings.fsrs_retention !== undefined) {
        const clamped = Math.min(0.97, Math.max(0.75, settings.fsrs_retention));
        updateStmt.run('fsrs_retention', clamped.toString());
      }

      return findUserSettings();
    } catch (err) {
      console.warn('SQLite saveUserSettings error, falling back to memory store:', err);
    }
  }

  return toPlain(store.userSettings);
}

