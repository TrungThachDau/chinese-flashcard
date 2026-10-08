import { Suspense } from 'react';
import { Metadata } from 'next';
import { loadServerAppData } from '@/lib/serverAppData';
import { MainClientApp } from '@/components/MainClientApp';
import { SplashScreen } from '@/components/SplashScreen';

export const metadata: Metadata = {
  title: 'Thống Kê Tiến Độ Học Tập | Hán Ngữ',
  description: 'Theo dõi tỷ lệ ghi nhớ, chuỗi ngày học liên tục và mức độ thành thạo các chủ đề.',
};

async function SsrStatsLoader() {
  const data = await loadServerAppData();
  return (
    <MainClientApp
      initialDueCards={data.dueCards}
      initialAllCards={data.allCards}
      initialQuestions={data.lifeQuestions}
      initialStats={data.studyStats}
      initialSettings={data.userSettings}
      initialTab="stats"
    />
  );
}

export default function StatsPage() {
  return (
    <Suspense fallback={<SplashScreen />}>
      <SsrStatsLoader />
    </Suspense>
  );
}

