import { connection } from 'next/server';
import {
  Card,
  CardStatus,
  CategoryInfo,
  LifeQuestion,
  StudyStats,
  UserSettings,
} from '@/models';
import { HSK30_LEVEL1_CARDS } from '@/models/data/hsk30Data';
import { INITIAL_LIFE_QUESTIONS, CATEGORIES_CONFIG } from '@/models/data/initialData';
import { isSupabaseConfigured } from '@/repositories/supabase/server.client';
import { fetchSupabaseAppRawData } from '@/repositories/supabase/progress.repository';
import { findAllCards, countCards, findDueCards } from '@/repositories/sqlite/card.repository';
import { findAllLifeQuestions } from '@/repositories/sqlite/life-question.repository';
import { findUserSettings } from '@/repositories/sqlite/settings.repository';
import { computeSqliteStudyStats, computeStreak } from '@/repositories/sqlite/stats.repository';

export interface LoadServerAppDataOptions {
  includeAllCards?: boolean;
  includeQuestions?: boolean;
  cardsLimit?: number;
}

export async function loadSupabaseAppData(options: LoadServerAppDataOptions = {}) {
  const { includeAllCards = false, includeQuestions = false, cardsLimit = 30 } = options;
  const rawData = await fetchSupabaseAppRawData(includeQuestions);
  if (!rawData) return null;

  const { username, displayName, savedSettings, cardProgressRows, reviewLogRows, questionProgressRows } =
    rawData;

  const defaultName = displayName || username || 'Học viên';

  // 1. Settings
  const userSettings: UserSettings = {
    user_name: savedSettings?.user_name || defaultName,
    daily_limit: savedSettings?.daily_limit ?? 15,
    speech_rate: savedSettings?.speech_rate ?? 0.85,
    audio_engine: savedSettings?.audio_engine || 'online',
    auto_play_audio: Boolean(savedSettings?.auto_play_audio),
    has_onboarded: Boolean(savedSettings?.has_onboarded ?? false),
    hsk_level: savedSettings?.hsk_level ?? 1,
    fsrs_retention: savedSettings?.fsrs_retention ?? 0.9,
  };

  // 2. Merge Cards with Progress
  const progressMap = new Map<string, any>();
  for (const row of cardProgressRows) {
    progressMap.set(row.card_key, row);
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
  const due = allCardsList.filter((c) => c.due_date <= nowIso || c.status === 'new');

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

  const totalReviews = reviewLogRows.length;
  const successReviews = reviewLogRows.filter((l: any) => l.rating >= 3).length;
  const retentionRate = totalReviews > 0 ? Math.round((successReviews / totalReviews) * 100) : 100;

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const todayReviewedCount = reviewLogRows.filter((l: any) => l.reviewed_at >= todayStart).length;

  const todayKey = nowIso.substring(0, 10);
  const reviewDays = reviewLogRows
    .map((l: any) => (typeof l.reviewed_at === 'string' ? l.reviewed_at.substring(0, 10) : ''))
    .filter(Boolean);
  const streakDays = computeStreak(reviewDays, todayKey);

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
    streak_days: streakDays,
    total_reviews: totalReviews,
    today_reviewed_count: todayReviewedCount,
    categories,
  };

  // 5. Life Questions
  let lifeQuestions: LifeQuestion[] = [];
  if (includeQuestions) {
    const qMap = new Map(questionProgressRows.map((q: any) => [q.question_id, q]));
    lifeQuestions = INITIAL_LIFE_QUESTIONS.map((q) => {
      const p: any = qMap.get(q.id);
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

export async function loadServerAppData(options: LoadServerAppDataOptions = {}) {
  const { includeAllCards = false, includeQuestions = false, cardsLimit = 30 } = options;

  try {
    await connection();
  } catch {
    // Ignore connection error if running outside standard request scope
  }

  if (isSupabaseConfigured()) {
    try {
      const supabaseData = await loadSupabaseAppData(options);
      if (supabaseData) {
        return supabaseData;
      }
    } catch (err) {
      console.warn('Supabase SSR load error, falling back to local database:', err);
    }
  }

  try {
    const userSettings = findUserSettings();
    const dueCards = findDueCards(userSettings.daily_limit);
    const totalCards = includeAllCards ? countCards() : 0;
    const allCards = includeAllCards ? findAllCards({ limit: cardsLimit, offset: 0 }) : [];
    const lifeQuestions = includeQuestions ? findAllLifeQuestions() : [];
    const studyStats = computeSqliteStudyStats();

    return {
      userSettings,
      dueCards,
      allCards,
      totalCards,
      lifeQuestions,
      studyStats,
    };
  } catch (error) {
    console.error('loadServerAppData error:', error);
    const defaultSettings = findUserSettings();
    const defaultDue = findDueCards(15);
    const defaultTotal = includeAllCards ? countCards() : 0;
    const defaultAll = includeAllCards ? findAllCards({ limit: cardsLimit, offset: 0 }) : [];
    const defaultQuestions = includeQuestions ? findAllLifeQuestions() : [];
    const defaultStats = computeSqliteStudyStats();

    return {
      userSettings: defaultSettings,
      dueCards: defaultDue,
      allCards: defaultAll,
      totalCards: defaultTotal,
      lifeQuestions: defaultQuestions,
      studyStats: defaultStats,
    };
  }
}

