import { Suspense } from 'react';
import { Metadata } from 'next';
import { loadServerAppData } from '@/services/app-data.service';
import { MainClientApp } from '@/components/MainClientApp';
import { AppSkeleton } from '@/components/AppSkeleton';

export const metadata: Metadata = {
  title: 'Học Thẻ Từ Vựng | Hán Ngữ',
  description: 'Ôn tập thẻ từ vựng chuẩn HSK 3.0 Cấp 1 với phương pháp ghi nhớ tự nhiên và bền vững.',
};

async function SsrFlashcardsLoader() {
  const data = await loadServerAppData({
    includeAllCards: false,
    includeQuestions: false,
  });
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
    <Suspense fallback={<AppSkeleton />}>
      <SsrFlashcardsLoader />
    </Suspense>
  );
}
