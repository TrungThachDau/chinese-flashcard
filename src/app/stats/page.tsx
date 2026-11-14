import { Suspense } from 'react';
import { Metadata } from 'next';
import { loadServerAppData } from '@/services/app-data.service';
import { MainClientApp } from '@/components/MainClientApp';
import { AppSkeleton } from '@/components/AppSkeleton';

export const metadata: Metadata = {
  title: 'Thống Kê Tiến Độ Học Tập | Hán Ngữ',
  description: 'Theo dõi tỷ lệ ghi nhớ, chuỗi ngày học liên tục và mức độ thành thạo các chủ đề.',
};

async function SsrStatsLoader() {
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
      isGuest={data.isGuest}
      initialTab="stats"
    />
  );
}

export default function StatsPage() {
  return (
    <Suspense fallback={<AppSkeleton />}>
      <SsrStatsLoader />
    </Suspense>
  );
}
