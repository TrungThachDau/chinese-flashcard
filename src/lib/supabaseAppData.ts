import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createClient as createServerSupabaseClient } from '@/utils/supabase/server';
import { HSK30_LEVEL1_CARDS } from './hsk30Data';
import { INITIAL_LIFE_QUESTIONS, CATEGORIES_CONFIG } from './initialData';
import {
  Card,
  CardStatus,
  CategoryInfo,
  LifeQuestion,
  StudyStats,
  UserSettings,
} from './types';
import { LoadServerAppDataOptions } from './serverAppData';

export async function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const defaultUserId = process.env.SUPABASE_USER_ID;

  if (!url || (!serviceRoleKey && !anonKey)) {
    return null;
  }

  // 1. Try cookie-based client first if authenticated session exists
  try {
    const cookieStore = await cookies();
    const cookieClient = createServerSupabaseClient(cookieStore);
    const {
      data: { user },
    } = await cookieClient.auth.getUser();
    if (user) {
      return { client: cookieClient, userId: user.id };
    }
  } catch {
    // No cookie context (e.g. static rendering or background task)
  }

  // 2. Service role client with defaultUserId from env
  if (serviceRoleKey && defaultUserId) {
    const client = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    return { client, userId: defaultUserId };
  }

  // 3. Anon key with defaultUserId
  if (anonKey && defaultUserId) {
    const client = createClient(url, anonKey, {
      auth: { persistSession: false },
    });
    return { client, userId: defaultUserId };
  }

  return null;
}

export async function loadSupabaseAppData(options: LoadServerAppDataOptions = {}) {
  const ctx = await getSupabaseServerClient();
  if (!ctx) return null;

  const { client, userId } = ctx;
  const { includeAllCards = false, includeQuestions = false, cardsLimit = 30 } = options;

  const [settingsRes, progressRes, logsRes, questionsRes] = await Promise.all([
    client.from('user_settings').select('settings').eq('user_id', userId).maybeSingle(),
    client.from('card_progress').select('*').eq('user_id', userId),
    client.from('review_logs').select('rating, reviewed_at').eq('user_id', userId),
    includeQuestions
      ? client.from('life_question_progress').select('*').eq('user_id', userId)
      : Promise.resolve({ data: null }),
  ]);

  // 1. Settings
  const userSettings: UserSettings = {
    user_name: settingsRes.data?.settings?.user_name || 'Trung',
    daily_limit: settingsRes.data?.settings?.daily_limit ?? 15,
    speech_rate: settingsRes.data?.settings?.speech_rate ?? 0.85,
    audio_engine: settingsRes.data?.settings?.audio_engine || 'online',
    auto_play_audio: Boolean(settingsRes.data?.settings?.auto_play_audio),
    has_onboarded: Boolean(settingsRes.data?.settings?.has_onboarded ?? true),
    hsk_level: settingsRes.data?.settings?.hsk_level ?? 1,
    fsrs_retention: settingsRes.data?.settings?.fsrs_retention ?? 0.9,
  };

  // 2. Merge Cards with Progress
  const progressMap = new Map<string, any>();
  if (progressRes.data) {
    for (const row of progressRes.data) {
      progressMap.set(row.card_key, row);
    }
  }

  const now = new Date();
  const nowIso = now.toISOString();

  const allCardsList: Card[] = HSK30_LEVEL1_CARDS.map((raw, idx) => {
    const key = `${raw.hanzi}|${raw.pinyin}`;
    const p = progressMap.get(key);
    if (p) {
      return {
        ...raw,
        id: idx + 1,
        repetition: p.repetition ?? 0,
        interval: p.interval ?? 0,
        ease_factor: p.ease_factor ?? 2.5,
        due_date: p.due_date || nowIso,
        last_reviewed: p.last_reviewed || null,
        status: (p.status as CardStatus) || 'new',
        stability: p.stability ?? 0,
        difficulty: p.difficulty ?? 0,
        lapses: p.lapses ?? 0,
        state: p.state ?? 0,
      };
    }
    return {
      ...raw,
      id: idx + 1,
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
    };
  });

  // 3. Compute Due Cards
  const due = allCardsList.filter((c) => {
    return c.due_date <= nowIso || c.status === 'new';
  });

  const statusPriority: Record<string, number> = {
    learning: 1,
    new: 2,
    reviewing: 3,
    mastered: 4,
  };

  due.sort((a, b) => {
    const prioA = statusPriority[a.status] || 5;
    const prioB = statusPriority[b.status] || 5;
    if (prioA !== prioB) return prioA - prioB;
    return a.due_date.localeCompare(b.due_date);
  });

  const dueCards = due.slice(0, userSettings.daily_limit);

  // 4. Compute Study Stats
  const totalCards = HSK30_LEVEL1_CARDS.length;
  let learningCount = 0;
  let reviewingCount = 0;
  let masteredCount = 0;
  let newCount = 0;
  let dueTodayCount = 0;

  for (const c of allCardsList) {
    if (c.status === 'mastered') masteredCount++;
    else if (c.status === 'learning') learningCount++;
    else if (c.status === 'reviewing') reviewingCount++;
    else newCount++;

    if (c.due_date <= nowIso) dueTodayCount++;
  }

  const logs = logsRes.data || [];
  const totalReviews = logs.length;
  const successReviews = logs.filter((l: any) => l.rating >= 3).length;
  const retentionRate = totalReviews > 0 ? Math.round((successReviews / totalReviews) * 100) : 100;

  // Compute today's reviews count (local calendar day)
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const todayReviewedCount = logs.filter((l: any) => l.reviewed_at >= todayStart).length;

  // Categories stats breakdown
  const categories: CategoryInfo[] = CATEGORIES_CONFIG.map((cfg) => {
    const catCards = allCardsList.filter((c) => c.category === cfg.id);
    return {
      id: cfg.id,
      name: cfg.name,
      icon: cfg.icon,
      color: cfg.color,
      total: catCards.length,
      new_count: catCards.filter((c) => c.status === 'new').length,
      learning_count: catCards.filter((c) => c.status === 'learning').length,
      reviewing_count: catCards.filter((c) => c.status === 'reviewing' || c.due_date <= nowIso).length,
      mastered_count: catCards.filter((c) => c.status === 'mastered').length,
    };
  });

  const studyStats: StudyStats = {
    total_cards: totalCards,
    new_cards: newCount,
    learning_cards: learningCount,
    reviewing_cards: reviewingCount,
    mastered_cards: masteredCount,
    due_today: dueTodayCount,
    retention_rate: retentionRate,
    streak_days: 1, // Active streak
    total_reviews: totalReviews,
    today_reviewed_count: todayReviewedCount,
    categories,
  };

  // 5. Life Questions
  let lifeQuestions: LifeQuestion[] = [];
  if (includeQuestions) {
    const qMap = new Map((questionsRes.data || []).map((q: any) => [q.question_id, q]));
    lifeQuestions = INITIAL_LIFE_QUESTIONS.map((q) => {
      const p = qMap.get(q.id);
      return {
        ...q,
        options: [...q.options],
        completed: p ? Boolean(p.completed) : false,
        last_practiced: p?.last_practiced || null,
      };
    });
  }

  const allCards = includeAllCards ? allCardsList.slice(0, cardsLimit) : [];

  return {
    userSettings,
    dueCards,
    allCards,
    totalCards,
    lifeQuestions,
    studyStats,
  };
}

export async function getSupabaseCards(options: {
  category?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
  mode?: string;
  dueOnly?: boolean;
  allowNew?: boolean;
} = {}) {
  const data = await loadSupabaseAppData({ includeAllCards: true, cardsLimit: 1000 });
  if (!data) return null;

  let cards = data.allCards;
  const now = new Date().toISOString();

  if (options.mode === 'learn_more') {
    const limit = options.limit ?? 30;
    const newCards = cards.filter((c) => c.status === 'new').slice(0, limit);
    return { cards: newCards, total: newCards.length, hasMore: false };
  }

  if (options.mode === 'review_learned') {
    const limit = options.limit ?? 30;
    const learned = cards
      .filter((c) => c.status !== 'new' || c.last_reviewed !== null)
      .sort((a, b) => (b.last_reviewed || '').localeCompare(a.last_reviewed || ''))
      .slice(0, limit);
    return { cards: learned, total: learned.length, hasMore: false };
  }

  if (options.dueOnly) {
    const limit = options.limit ?? 30;
    const due = cards.filter((c) => {
      if (options.allowNew !== false) {
        return c.due_date <= now || c.status === 'new';
      }
      return c.due_date <= now && c.status !== 'new';
    });
    return { cards: due.slice(0, limit), total: due.length, hasMore: false };
  }

  // Filter by category
  if (options.category && options.category !== 'all') {
    cards = cards.filter((c) => c.category === options.category);
  }

  // Filter by status
  if (options.status && options.status !== 'all') {
    cards = cards.filter((c) => c.status === options.status);
  }

  // Filter by search
  if (options.search) {
    const q = options.search.toLowerCase();
    cards = cards.filter(
      (c) =>
        c.hanzi.toLowerCase().includes(q) ||
        c.pinyin.toLowerCase().includes(q) ||
        c.meaning.toLowerCase().includes(q) ||
        (c.sino_vietnamese && c.sino_vietnamese.toLowerCase().includes(q))
    );
  }

  const total = cards.length;
  const offset = options.offset ?? 0;
  const limit = options.limit ?? 30;
  const paginated = cards.slice(offset, offset + limit);
  const hasMore = offset + paginated.length < total;

  return { cards: paginated, total, hasMore };
}
