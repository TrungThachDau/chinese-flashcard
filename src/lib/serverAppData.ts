import { connection } from 'next/server';
import {
  getDueCards,
  getAllCards,
  getCardsCount,
  getLifeQuestions,
  getStudyStats,
  getUserSettings,
} from '@/lib/db';
import { loadSupabaseAppData } from './supabaseAppData';

export interface LoadServerAppDataOptions {
  includeAllCards?: boolean;
  includeQuestions?: boolean;
  cardsLimit?: number;
}

export async function loadServerAppData(options: LoadServerAppDataOptions = {}) {
  const { includeAllCards = false, includeQuestions = false, cardsLimit = 30 } = options;

  try {
    // Opt into request-time SSR for real-time database queries
    await connection();
  } catch {
    // Ignore connection error if running outside standard request scope
  }

  // 1. Prefer Supabase if configured (essential for Vercel Serverless & cloud persistence)
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
  ) {
    try {
      const supabaseData = await loadSupabaseAppData(options);
      if (supabaseData) {
        return supabaseData;
      }
    } catch (err) {
      console.warn('Supabase SSR load error, falling back to local database:', err);
    }
  }

  // 2. Fallback to SQLite (local development mode)
  try {
    const userSettings = getUserSettings();
    const dueCards = getDueCards(userSettings.daily_limit);
    const totalCards = includeAllCards ? getCardsCount() : 0;
    const allCards = includeAllCards ? getAllCards({ limit: cardsLimit, offset: 0 }) : [];
    const lifeQuestions = includeQuestions ? getLifeQuestions() : [];
    const studyStats = getStudyStats();

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
    const defaultSettings = getUserSettings();
    const defaultDue = getDueCards(15);
    const defaultTotal = includeAllCards ? getCardsCount() : 0;
    const defaultAll = includeAllCards ? getAllCards({ limit: cardsLimit, offset: 0 }) : [];
    const defaultQuestions = includeQuestions ? getLifeQuestions() : [];
    const defaultStats = getStudyStats();

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

