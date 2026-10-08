import { Suspense } from 'react';
import { Metadata } from 'next';
import { loadServerAppData } from '@/lib/serverAppData';
import { MainClientApp } from '@/components/MainClientApp';
import { SplashScreen } from '@/components/SplashScreen';

export const metadata: Metadata = {
  title: 'Thẻ Flashcard SRS | Hán Ngữ',
  description: 'Ôn tập từ vựng HSK 1 với thuật toán lặp lại ngắt quãng SM-2.',
};

async function SsrAppLoader() {
  const data = await loadServerAppData();
  return (
    <MainClientApp
      initialDueCards={data.dueCards}
      initialAllCards={data.allCards}
      initialQuestions={data.lifeQuestions}
      initialStats={data.studyStats}
      initialSettings={data.userSettings}
      initialTab="flashcards"
    />
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<SplashScreen />}>
      <SsrAppLoader />
    </Suspense>
  );
}
