import { LifeQuestion } from '@/models';
import {
  findAllLifeQuestions,
  markLifeQuestionCompleted,
} from '@/repositories/sqlite/life-question.repository';
import { upsertSupabaseLifeQuestion } from '@/repositories/supabase/progress.repository';
import { loadSupabaseAppData } from './app-data.service';

export function getLifeQuestions(): LifeQuestion[] {
  return findAllLifeQuestions();
}

export function recordLifeQuestionPractice(questionId: number): boolean {
  return markLifeQuestionCompleted(questionId);
}

export async function fetchLifeQuestions(): Promise<LifeQuestion[]> {
  const sbData = await loadSupabaseAppData({ includeQuestions: true });
  if (sbData?.lifeQuestions) {
    return sbData.lifeQuestions;
  }
  return findAllLifeQuestions();
}

export async function submitLifeQuestionPractice(questionId: number): Promise<boolean> {
  const synced = await upsertSupabaseLifeQuestion(questionId);
  if (synced) {
    return true;
  }
  return markLifeQuestionCompleted(questionId);
}

