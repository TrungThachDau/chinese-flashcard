import { connection } from 'next/server';
import {
  getDueCards,
  getAllCards,
  getLifeQuestions,
  getStudyStats,
  getUserSettings,
} from '@/lib/db';

export async function loadServerAppData() {
  try {
    // Opt into request-time SSR for real-time database queries
    await connection();
  } catch {
    // Ignore connection error if running outside standard request scope
  }

  try {
    const userSettings = getUserSettings();
    const dueCards = getDueCards(userSettings.daily_limit);
    const allCards = getAllCards();
    const lifeQuestions = getLifeQuestions();
    const studyStats = getStudyStats();

    return {
      userSettings,
      dueCards,
      allCards,
      lifeQuestions,
      studyStats,
    };
  } catch (error) {
    console.error('loadServerAppData error:', error);
    const defaultSettings = getUserSettings();
    const defaultDue = getDueCards(15);
    const defaultAll = getAllCards();
    const defaultQuestions = getLifeQuestions();
    const defaultStats = getStudyStats();

    return {
      userSettings: defaultSettings,
      dueCards: defaultDue,
      allCards: defaultAll,
      lifeQuestions: defaultQuestions,
      studyStats: defaultStats,
    };
  }
}

