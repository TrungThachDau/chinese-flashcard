import { Suspense } from 'react';
import { connection } from 'next/server';
import { getDueCards, getAllCards, getLifeQuestions, getStudyStats, getUserSettings } from '@/lib/db';
import { MainClientApp } from '@/components/MainClientApp';

async function SsrAppLoader() {
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

    return (
      <MainClientApp
        initialDueCards={dueCards}
        initialAllCards={allCards}
        initialQuestions={lifeQuestions}
        initialStats={studyStats}
        initialSettings={userSettings}
      />
    );
  } catch (error) {
    console.error('SSR App Loader error:', error);
    // Safe fallback defaults to avoid React error #441 on server render
    const defaultSettings = getUserSettings();
    const defaultDue = getDueCards(15);
    const defaultAll = getAllCards();
    const defaultQuestions = getLifeQuestions();
    const defaultStats = getStudyStats();

    return (
      <MainClientApp
        initialDueCards={defaultDue}
        initialAllCards={defaultAll}
        initialQuestions={defaultQuestions}
        initialStats={defaultStats}
        initialSettings={defaultSettings}
      />
    );
  }
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-amber-50/50 via-rose-50/30 to-indigo-50/50 dark:from-slate-950 dark:to-slate-900">
          <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            Đang tải dữ liệu HSK 1 & hệ thống SRS...
          </p>
        </div>
      }
    >
      <SsrAppLoader />
    </Suspense>
  );
}
