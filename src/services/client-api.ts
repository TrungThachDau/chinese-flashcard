import {
  clearGuestData,
  getGuestQuestions,
  getGuestStats,
  queryGuestCards,
  completeGuestQuestion,
  saveGuestSettings,
} from '@/services/guest.service';
import { UserSettings } from '@/models';

/** Data-access helpers that read from IndexedDB in guest mode and the API otherwise. */

let guestMode = false;

export function setGuestMode(value: boolean) {
  guestMode = value;
}

export function isGuestMode() {
  return guestMode;
}

async function readApiResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.ok) {
    throw new Error(data?.error || `Request failed with status ${response.status}`);
  }
  return data as T;
}

export async function fetchCardsApi(params: URLSearchParams | string): Promise<any> {
  const query = typeof params === 'string' ? params : params.toString();
  if (guestMode) return queryGuestCards(new URLSearchParams(query));
  return readApiResponse(await fetch(`/api/cards?${query}`));
}

export async function fetchStatsApi(): Promise<any> {
  if (guestMode) return { ok: true, stats: await getGuestStats() };
  return readApiResponse(
    await fetch(`/api/stats?tz=${new Date().getTimezoneOffset()}`, { cache: 'no-store' })
  );
}

export async function fetchQuestionsApi(): Promise<any> {
  if (guestMode) return { ok: true, questions: await getGuestQuestions() };
  return readApiResponse(await fetch('/api/life-questions'));
}

export async function saveSettingsApi(settings: Partial<UserSettings>): Promise<any> {
  if (guestMode) return { ok: true, settings: await saveGuestSettings(settings) };
  return readApiResponse(
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
      keepalive: true,
    })
  );
}

export async function resetDataApi(): Promise<void> {
  if (guestMode) {
    await clearGuestData();
    return;
  }
  await readApiResponse(await fetch('/api/reset', { method: 'POST' }));
}

export async function completeQuestionApi(questionId: number): Promise<void> {
  if (guestMode) {
    await completeGuestQuestion(questionId);
    return;
  }
  await readApiResponse(
    await fetch('/api/life-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId }),
    })
  );
}
