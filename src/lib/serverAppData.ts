import { connection } from 'next/server';
import {
  getDueCards,
  getAllCards,
  getCardsCount,
  getLifeQuestions,
  getStudyStats,
  getUserSettings,
} from '@/lib/db';

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

