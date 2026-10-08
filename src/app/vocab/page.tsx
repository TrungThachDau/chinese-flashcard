import { Suspense } from 'react';
import { Metadata } from 'next';
import { loadServerAppData } from '@/lib/serverAppData';
import { MainClientApp } from '@/components/MainClientApp';
import { AppSkeleton } from '@/components/AppSkeleton';

export const metadata: Metadata = {
  title: 'Kho Từ Vựng HSK 1 | Hán Ngữ',
  description: 'Tra cứu danh sách 500+ từ vựng HSK 1, bộ thủ, số nét và câu ví dụ.',
};

async function SsrVocabLoader() {
  const data = await loadServerAppData({
    includeAllCards: true,
    includeQuestions: false,
  });
  return (
    <MainClientApp
      initialDueCards={data.dueCards}
      initialAllCards={data.allCards}
      initialQuestions={data.lifeQuestions}
      initialStats={data.studyStats}
      initialSettings={data.userSettings}
      initialTab="vocab"
    />
  );
}

export default function VocabPage() {
  return (
    <Suspense fallback={<AppSkeleton />}>
      <SsrVocabLoader />
    </Suspense>
  );
}

