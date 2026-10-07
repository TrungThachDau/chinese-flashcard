import { Suspense } from 'react';
import { connection } from 'next/server';
import { getDueCards, getAllCards, getLifeQuestions, getStudyStats, getUserSettings } from '@/lib/db';
import { MainClientApp } from '@/components/MainClientApp';

async function SsrAppLoader() {
  // Opt into request-time SSR for real-time SQLite database queries
  await connection();

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
