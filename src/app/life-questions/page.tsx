import { Suspense } from 'react';
import { Metadata } from 'next';
import { loadServerAppData } from '@/lib/serverAppData';
import { MainClientApp } from '@/components/MainClientApp';
import { SplashScreen } from '@/components/SplashScreen';

export const metadata: Metadata = {
  title: 'Hội Thoại Đời Sống HSK 1 | Hán Ngữ',
  description: 'Luyện phản xạ giao tiếp tiếng Trung các tình huống thực tế hàng ngày.',
};

async function SsrLifeQuestionsLoader() {
  const data = await loadServerAppData();
  return (
    <MainClientApp
      initialDueCards={data.dueCards}
      initialAllCards={data.allCards}
      initialQuestions={data.lifeQuestions}
      initialStats={data.studyStats}
      initialSettings={data.userSettings}
      initialTab="life_questions"
    />
  );
}

export default function LifeQuestionsPage() {
  return (
    <Suspense fallback={<SplashScreen />}>
      <SsrLifeQuestionsLoader />
    </Suspense>
  );
}

