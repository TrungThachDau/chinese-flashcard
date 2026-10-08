import { Suspense } from 'react';
import { Metadata } from 'next';
import { loadServerAppData } from '@/lib/serverAppData';
import { MainClientApp } from '@/components/MainClientApp';
import { SplashScreen } from '@/components/SplashScreen';

export const metadata: Metadata = {
  title: 'Thẻ Flashcard SRS | Hán Ngữ',
  description: 'Ôn tập thẻ học từ vựng HSK 1 với hệ thống lặp lại ngắt quãng SM-2.',
};

async function SsrFlashcardsLoader() {
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

export default function FlashcardsPage() {
  return (
    <Suspense fallback={<SplashScreen />}>
      <SsrFlashcardsLoader />
    </Suspense>
  );
}

