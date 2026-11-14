import {
  Card,
  CardFilterOptions,
  CardStatus,
  CategoryInfo,
  DEFAULT_USER_SETTINGS,
  GuestImportPayload,
  LifeQuestion,
  LocalCardProgress,
  LocalReviewQueueItem,
  StudyStats,
  UserSettings,
  makeCardKey,
} from '@/models';
import { getLocalDb } from '@/repositories/local/indexeddb.repository';

/**
 * Guest mode: learning without an account. Everything is stored in the browser's
 * IndexedDB and is imported into the user's database the first time they sign in/up.
 */

const SETTINGS_KEY = 'settings';
const QUESTIONS_KEY = 'life_questions';

type BaseData = {
  cards: Card[];
  questions: LifeQuestion[];
  categories: typeof import('@/models/data/initialData').CATEGORIES_CONFIG;
};

let basePromise: Promise<BaseData> | null = null;

function loadBase(): Promise<BaseData> {
  if (!basePromise) {
    basePromise = Promise.all([
      import('@/models/data/hsk30Data'),
      import('@/models/data/initialData'),
    ]).then(([hsk, initial]) => {
      const nowIso = new Date().toISOString();
      const cards: Card[] = hsk.HSK30_LEVEL1_CARDS.map((raw, idx) => ({
        ...raw,
        id: idx + 1,
        hsk: raw.hsk ?? 1,
        tags: raw.tags ?? ['HSK 1'],
        repetition: 0,
        interval: 0,
        ease_factor: 2.5,
        due_date: nowIso,
        last_reviewed: null,
        status: 'new' as CardStatus,
        stability: 0,
        difficulty: 0,
        lapses: 0,
        state: 0,
      }));
      return {
        cards,
        questions: initial.INITIAL_LIFE_QUESTIONS,
        categories: initial.CATEGORIES_CONFIG,
      };
    });
  }
  return basePromise;
}

async function loadMergedCards(): Promise<Card[]> {
  const db = getLocalDb();
  const base = await loadBase();
  const rows = db ? await db.guest_progress.toArray() : [];
  if (rows.length === 0) return base.cards;

  const map = new Map(rows.map((r) => [r.card_key, r]));
  return base.cards.map((c) => {
    const p = map.get(makeCardKey(c));
    if (!p) return c;
    return {
      ...c,
      repetition: p.repetition,
      interval: p.interval,
      ease_factor: p.ease_factor,
      due_date: p.due_date,
      last_reviewed: p.last_reviewed,
      status: p.status,
      stability: p.stability ?? 0,
      difficulty: p.difficulty ?? 0,
      lapses: p.lapses ?? 0,
      state: p.state ?? 0,
    };
  });
}

const STATUS_PRIORITY: Record<string, number> = { learning: 1, new: 2, reviewing: 3, mastered: 4 };

function pickDue(cards: Card[], limit: number, allowNew = true): Card[] {
  const nowIso = new Date().toISOString();
  return cards
    .filter((c) =>
      allowNew ? c.due_date <= nowIso || c.status === 'new' : c.due_date <= nowIso && c.status !== 'new'
    )
    .sort((a, b) => {
      const pa = STATUS_PRIORITY[a.status] || 5;
      const pb = STATUS_PRIORITY[b.status] || 5;
      if (pa !== pb) return pa - pb;
      return a.due_date.localeCompare(b.due_date);
    })
    .slice(0, limit);
}

export async function getGuestSettings(): Promise<UserSettings> {
  const db = getLocalDb();
  const row = db ? await db.guest_meta.get(SETTINGS_KEY) : undefined;
  return { ...DEFAULT_USER_SETTINGS, ...((row?.value as Partial<UserSettings>) || {}) };
}

export async function saveGuestSettings(patch: Partial<UserSettings>): Promise<UserSettings> {
  const merged: UserSettings = { ...(await getGuestSettings()), ...patch, has_onboarded: true };
  const db = getLocalDb();
  if (db) {
    await db.guest_meta.put({
      key: SETTINGS_KEY,
      value: merged as unknown as Record<string, unknown>,
      updated_at: new Date().toISOString(),
    });
  }
  return merged;
}

export async function getGuestDueCards(limit?: number, allowNew = true): Promise<Card[]> {
  const settings = await getGuestSettings();
  return pickDue(await loadMergedCards(), limit ?? settings.daily_limit, allowNew);
}

export async function recordGuestReview(item: LocalReviewQueueItem): Promise<void> {
  const db = getLocalDb();
  if (!db) return;
  await db.transaction('rw', db.guest_progress, db.guest_logs, async () => {
    await db.guest_progress.put({
      card_key: item.card_key,
      card_id: item.card_id,
      repetition: item.repetition,
      interval: item.interval,
      ease_factor: item.ease_factor,
      due_date: item.due_date,
      last_reviewed: item.reviewed_at,
      status: item.status,
      stability: item.stability,
      difficulty: item.difficulty,
      lapses: item.lapses,
      state: item.state,
      updated_at: new Date().toISOString(),
    });
    await db.guest_logs.add({
      card_key: item.card_key,
      rating: item.rating,
      reviewed_at: item.reviewed_at,
      interval: item.interval,
      ease_factor: item.ease_factor,
    });
  });
}

export async function queryGuestCards(params: URLSearchParams) {
  const options: CardFilterOptions = {
    category: params.get('category') || undefined,
    status: params.get('status') || undefined,
    search: params.get('search') || undefined,
    hsk: params.get('hsk') || undefined,
    mode: params.get('mode') || undefined,
    dueOnly: params.get('dueOnly') === 'true',
    allowNew: params.get('allowNew') !== 'false',
  };
  const limitParam = params.get('limit');
  const limit = limitParam === 'all' ? Infinity : limitParam ? parseInt(limitParam, 10) : 30;
  const offset = parseInt(params.get('offset') || '0', 10);

  const all = await loadMergedCards();

  if (options.mode === 'learn_more') {
    const cards = all.filter((c) => c.status === 'new').slice(0, limit);
    return { ok: true, cards, total: cards.length, hasMore: false };
  }

  if (options.mode === 'review_learned') {
    const cards = all
      .filter((c) => c.status !== 'new' || c.last_reviewed !== null)
      .sort((a, b) => (b.last_reviewed || '').localeCompare(a.last_reviewed || ''))
      .slice(0, limit);
    return { ok: true, cards, total: cards.length, hasMore: false };
  }

  if (options.dueOnly) {
    const nowIso = new Date().toISOString();
    const due = all.filter((c) =>
      options.allowNew ? c.due_date <= nowIso || c.status === 'new' : c.due_date <= nowIso && c.status !== 'new'
    );
    return { ok: true, cards: due.slice(0, limit), total: due.length, hasMore: false };
  }

  let cards = all;
  if (options.hsk && options.hsk !== 'all') cards = cards.filter((c) => c.hsk === Number(options.hsk));
  if (options.category && options.category !== 'all') cards = cards.filter((c) => c.category === options.category);
  if (options.status && options.status !== 'all') cards = cards.filter((c) => c.status === options.status);
  if (options.search) {
    const q = options.search.toLowerCase();
    cards = cards.filter(
      (c) =>
        c.hanzi.toLowerCase().includes(q) ||
        c.pinyin.toLowerCase().includes(q) ||
        c.meaning.toLowerCase().includes(q) ||
        (c.sino_vietnamese && c.sino_vietnamese.toLowerCase().includes(q)) ||
        (c.tags && c.tags.some((t) => t.toLowerCase().includes(q)))
    );
  }

  const total = cards.length;
  const page = cards.slice(offset, offset + limit);
  return { ok: true, cards: page, total, hasMore: offset + page.length < total };
}

function localDayKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export async function getGuestStats(): Promise<StudyStats> {
  const db = getLocalDb();
  const base = await loadBase();
  const cards = await loadMergedCards();
  const logs = db ? await db.guest_logs.toArray() : [];

  const now = new Date();
  const nowIso = now.toISOString();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  let learning = 0;
  let reviewing = 0;
  let mastered = 0;
  let fresh = 0;
  let dueToday = 0;
  for (const c of cards) {
    if (c.status === 'mastered') mastered++;
    else if (c.status === 'learning') learning++;
    else if (c.status === 'reviewing') reviewing++;
    else fresh++;
    if (c.due_date <= nowIso) dueToday++;
  }

  const success = logs.filter((l) => l.rating >= 3).length;
  const days = new Set(logs.map((l) => localDayKey(new Date(l.reviewed_at))));
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!days.has(localDayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(localDayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  const categories: CategoryInfo[] = base.categories.map((cfg) => {
    const cat = cards.filter((c) => c.category === cfg.id);
    return {
      id: cfg.id,
      name: cfg.name,
      icon: cfg.icon,
      color: cfg.color,
      total: cat.length,
      new_count: cat.filter((c) => c.status === 'new').length,
      learning_count: cat.filter((c) => c.status === 'learning').length,
      reviewing_count: cat.filter((c) => c.status === 'reviewing' || c.due_date <= nowIso).length,
      mastered_count: cat.filter((c) => c.status === 'mastered').length,
    };
  });

  return {
    total_cards: cards.length,
    new_cards: fresh,
    learning_cards: learning,
    reviewing_cards: reviewing,
    mastered_cards: mastered,
    due_today: dueToday,
    retention_rate: logs.length > 0 ? Math.round((success / logs.length) * 100) : 100,
    streak_days: streak,
    total_reviews: logs.length,
    today_reviewed_count: logs.filter((l) => l.reviewed_at >= todayStart).length,
    categories,
  };
}

async function readQuestionProgress(): Promise<Record<string, string | null>> {
  const db = getLocalDb();
  const row = db ? await db.guest_meta.get(QUESTIONS_KEY) : undefined;
  return (row?.value as Record<string, string | null>) || {};
}

export async function getGuestQuestions(): Promise<LifeQuestion[]> {
  const base = await loadBase();
  const progress = await readQuestionProgress();
  return base.questions.map((q) => ({
    ...q,
    options: [...q.options],
    completed: q.id in progress,
    last_practiced: progress[q.id] ?? null,
  }));
}

export async function completeGuestQuestion(questionId: number): Promise<void> {
  const db = getLocalDb();
  if (!db) return;
  const progress = await readQuestionProgress();
  progress[questionId] = new Date().toISOString();
  await db.guest_meta.put({
    key: QUESTIONS_KEY,
    value: progress as unknown as Record<string, unknown>,
    updated_at: new Date().toISOString(),
  });
}

export async function clearGuestData(): Promise<void> {
  const db = getLocalDb();
  if (!db) return;
  await Promise.all([db.guest_progress.clear(), db.guest_logs.clear(), db.guest_meta.clear()]);
}

/** Collect guest data for import. Returns null when the guest has not studied anything. */
export async function readGuestImportPayload(): Promise<GuestImportPayload | null> {
  const db = getLocalDb();
  if (!db) return null;

  const [cards, logs, questions, settingsRow] = await Promise.all([
    db.guest_progress.toArray(),
    db.guest_logs.toArray(),
    readQuestionProgress(),
    db.guest_meta.get(SETTINGS_KEY),
  ]);

  const lifeQuestions = Object.entries(questions).map(([id, last]) => ({
    id: Number(id),
    last_practiced: last,
  }));

  if (cards.length === 0 && logs.length === 0 && lifeQuestions.length === 0 && !settingsRow) {
    return null;
  }

  return {
    cards: cards.map((c: LocalCardProgress) => ({
      card_key: c.card_key,
      repetition: c.repetition,
      interval: c.interval,
      ease_factor: c.ease_factor,
      due_date: c.due_date,
      last_reviewed: c.last_reviewed,
      status: c.status,
      stability: c.stability,
      difficulty: c.difficulty,
      lapses: c.lapses,
      state: c.state,
    })),
    review_logs: logs.map((l) => ({
      card_key: l.card_key,
      rating: l.rating,
      reviewed_at: l.reviewed_at,
      interval: l.interval,
      ease_factor: l.ease_factor,
    })),
    life_questions: lifeQuestions,
    settings: (settingsRow?.value as Record<string, unknown>) ?? null,
  };
}

/** Upload guest data to the signed-in account; clears local guest data on success. */
export async function importGuestDataToAccount(): Promise<boolean> {
  try {
    const payload = await readGuestImportPayload();
    if (!payload) return true;
    const res = await fetch('/api/guest/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) return false;
    await clearGuestData();
    return true;
  } catch (err) {
    console.warn('Guest data import failed (kept locally for retry):', err);
    return false;
  }
}
