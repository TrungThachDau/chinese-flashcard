import { Suspense } from 'react';
import { Metadata } from 'next';
import { loadServerAppData } from '@/services/app-data.service';
import { MainClientApp } from '@/components/MainClientApp';
import { AppSkeleton } from '@/components/AppSkeleton';

export const metadata: Metadata = {
  title: 'Luyện Phản Xạ Đời Sống | Hán Ngữ',
  description: 'Thực hành các mẫu câu đối thoại thực tế theo tình huống thông dụng.',
};

async function SsrLifeQuestionsLoader() {
  const data = await loadServerAppData({
    includeAllCards: false,
    includeQuestions: true,
  });
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
    <Suspense fallback={<AppSkeleton />}>
      <SsrLifeQuestionsLoader />
    </Suspense>
  );
}
