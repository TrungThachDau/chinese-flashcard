import { DEFAULT_USER_SETTINGS, GuestImportPayload, UserSettings } from '@/models';
import { HSK30_LEVEL1_CARDS } from '@/models/data/hsk30Data';
import { INITIAL_LIFE_QUESTIONS } from '@/models/data/initialData';
import { getAuthenticatedSupabaseServerClient } from '@/repositories/supabase/server.client';

const STATUSES = new Set(['new', 'learning', 'reviewing', 'mastered']);
const MAX_ROWS = 100_000;
const CHUNK = 500;

const VALID_CARD_KEYS = new Set(HSK30_LEVEL1_CARDS.map((c) => `${c.hanzi}|${c.pinyin}`));
const VALID_QUESTION_IDS = new Set(INITIAL_LIFE_QUESTIONS.map((q) => q.id));

function toIso(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const t = Date.parse(value);
  return Number.isNaN(t) ? null : new Date(t).toISOString();
}

function num(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/**
 * Merge guest progress into the current account. Existing cloud progress wins unless the
 * guest reviewed the card more recently. Safe to run repeatedly.
 */
export async function importGuestProgress(payload: GuestImportPayload) {
  const ctx = await getAuthenticatedSupabaseServerClient();
  if (!ctx) return null;
  const { client, userId } = ctx;

  const cards = Array.isArray(payload?.cards) ? payload.cards.slice(0, MAX_ROWS) : [];
  const logs = Array.isArray(payload?.review_logs) ? payload.review_logs.slice(0, MAX_ROWS) : [];
  const questions = Array.isArray(payload?.life_questions) ? payload.life_questions : [];

  const { data: existingRows, error: existingError } = await client
    .from('card_progress')
    .select('card_key, last_reviewed')
    .eq('user_id', userId);
  if (existingError) throw new Error(existingError.message || 'Could not load existing progress');
  const existing = new Map<string, string | null>(
    (existingRows || []).map((r) => [r.card_key, r.last_reviewed ? new Date(r.last_reviewed).toISOString() : null])
  );

  const now = new Date().toISOString();
  const progressRows: Record<string, unknown>[] = [];
  for (const c of cards) {
    if (!c || !VALID_CARD_KEYS.has(c.card_key) || !STATUSES.has(c.status)) continue;
    const dueDate = toIso(c.due_date);
    if (!dueDate) continue;
    const lastReviewed = toIso(c.last_reviewed);

    if (existing.has(c.card_key)) {
      const current = existing.get(c.card_key);
      if (current && (!lastReviewed || lastReviewed <= current)) continue;
    }

    progressRows.push({
      user_id: userId,
      card_key: c.card_key,
      repetition: Math.max(0, Math.round(num(c.repetition, 0))),
      interval: Math.max(0, Math.round(num(c.interval, 0))),
      ease_factor: num(c.ease_factor, 2.5),
      due_date: dueDate,
      last_reviewed: lastReviewed,
      status: c.status,
      updated_at: now,
    });
  }

  const logRows: Record<string, unknown>[] = [];
  for (const l of logs) {
    const reviewedAt = l ? toIso(l.reviewed_at) : null;
    const rating = l ? Math.round(num(l.rating, 0)) : 0;
    if (!l || !reviewedAt || !VALID_CARD_KEYS.has(l.card_key) || rating < 1 || rating > 4) continue;
    logRows.push({
      user_id: userId,
      card_key: l.card_key,
      rating,
      reviewed_at: reviewedAt,
      interval: Math.max(0, Math.round(num(l.interval, 0))),
      ease_factor: num(l.ease_factor, 2.5),
    });
  }

  const questionRows = questions
    .filter((q) => q && VALID_QUESTION_IDS.has(Number(q.id)))
    .map((q) => ({
      user_id: userId,
      question_id: Number(q.id),
      completed: true,
      last_practiced: toIso(q.last_practiced) || now,
    }));

  const writes: Array<PromiseLike<{ error: any }>> = [];
  for (let i = 0; i < progressRows.length; i += CHUNK) {
    writes.push(
      client.from('card_progress').upsert(progressRows.slice(i, i + CHUNK), { onConflict: 'user_id,card_key' })
    );
  }
  for (let i = 0; i < logRows.length; i += CHUNK) {
    writes.push(
      client
        .from('review_logs')
        .upsert(logRows.slice(i, i + CHUNK), { onConflict: 'user_id,card_key,reviewed_at', ignoreDuplicates: true })
    );
  }
  if (questionRows.length > 0) {
    writes.push(client.from('life_question_progress').upsert(questionRows, { onConflict: 'user_id,question_id' }));
  }

  const results = await Promise.all(writes);
  const failed = results.find((r) => r.error);
  if (failed) throw new Error(failed.error.message || 'Supabase import failed');

  // Guest preferences only apply to accounts that have not been customised yet.
  if (payload.settings && typeof payload.settings === 'object') {
    const { data: row, error: settingsError } = await client
      .from('user_settings')
      .select('settings')
      .eq('user_id', userId)
      .maybeSingle();
    if (settingsError) throw new Error(settingsError.message || 'Could not load account settings');
    const current = (row?.settings || {}) as Partial<UserSettings>;
    if (!current.has_onboarded) {
      const guest = payload.settings as Partial<UserSettings>;
      const guestName =
        typeof guest.user_name === 'string' && guest.user_name && guest.user_name !== DEFAULT_USER_SETTINGS.user_name
          ? guest.user_name
          : undefined;
      const merged: UserSettings = {
        ...DEFAULT_USER_SETTINGS,
        ...current,
        ...(typeof guest.user_name === 'string' ? { user_name: guest.user_name.slice(0, 100) } : {}),
        ...(Number.isInteger(guest.daily_limit) && guest.daily_limit! > 0
          ? { daily_limit: guest.daily_limit }
          : {}),
        ...(typeof guest.speech_rate === 'number' && Number.isFinite(guest.speech_rate)
          ? { speech_rate: guest.speech_rate }
          : {}),
        ...(guest.audio_engine === 'online' || guest.audio_engine === 'browser'
          ? { audio_engine: guest.audio_engine }
          : {}),
        ...(typeof guest.auto_play_audio === 'boolean' ? { auto_play_audio: guest.auto_play_audio } : {}),
        ...(Number.isInteger(guest.hsk_level) ? { hsk_level: guest.hsk_level } : {}),
        ...(typeof guest.fsrs_retention === 'number' && Number.isFinite(guest.fsrs_retention)
          ? { fsrs_retention: guest.fsrs_retention }
          : {}),
        user_name: current.user_name || guestName || DEFAULT_USER_SETTINGS.user_name,
        has_onboarded: guest.has_onboarded === true,
      };
      const { error } = await client.from('user_settings').upsert({ user_id: userId, settings: merged, updated_at: now });
      if (error) throw new Error(error.message || 'Could not save imported account settings');
    }
  }

  return {
    cards: progressRows.length,
    review_logs: logRows.length,
    life_questions: questionRows.length,
  };
}
