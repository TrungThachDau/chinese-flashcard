import { UserSettings } from '@/models';
import { getSupabaseServerClient } from './server.client';

export async function fetchSupabaseAppRawData(includeQuestions: boolean = false) {
  const ctx = await getSupabaseServerClient();
  if (!ctx) return null;

  const { client, userId, username, displayName } = ctx;

  const [settingsRes, progressRes, logsRes, questionsRes] = await Promise.all([
    client.from('user_settings').select('settings').eq('user_id', userId).maybeSingle(),
    client.from('card_progress').select('*').eq('user_id', userId),
    client.from('review_logs').select('card_key, rating, reviewed_at').eq('user_id', userId),
    includeQuestions
      ? client.from('life_question_progress').select('*').eq('user_id', userId)
      : Promise.resolve({ data: null }),
  ]);

  return {
    userId,
    username,
    displayName,
    savedSettings: settingsRes.data?.settings as Partial<UserSettings> | undefined,
    cardProgressRows: progressRes.data || [],
    reviewLogRows: logsRes.data || [],
    questionProgressRows: questionsRes.data || [],
  };
}

export async function fetchSupabaseUserSettingsRow() {
  const ctx = await getSupabaseServerClient();
  if (!ctx) return null;

  const { client, userId, username, displayName } = ctx;
  const { data } = await client
    .from('user_settings')
    .select('settings')
    .eq('user_id', userId)
    .maybeSingle();

  return {
    client,
    userId,
    username,
    displayName,
    savedSettings: data?.settings as Partial<UserSettings> | undefined,
  };
}

export async function upsertSupabaseUserSettings(userId: string, settings: UserSettings, customClient?: any) {
  const ctx = customClient ? { client: customClient, userId } : await getSupabaseServerClient();
  if (!ctx) return false;

  const { error } = await ctx.client.from('user_settings').upsert({
    user_id: userId,
    settings,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error('Supabase settings upsert error:', error);
    return false;
  }
  return true;
}

export async function upsertSupabaseCardReview(params: {
  cardKey: string;
  repetition: number;
  interval: number;
  easeFactor: number;
  dueDate: string;
  lastReviewed: string | null;
  status: string;
  rating: number;
}) {
  const ctx = await getSupabaseServerClient();
  if (!ctx) return false;

  const { client, userId } = ctx;

  await client.from('card_progress').upsert(
    {
      user_id: userId,
      card_key: params.cardKey,
      repetition: params.repetition,
      interval: params.interval,
      ease_factor: params.easeFactor,
      due_date: params.dueDate,
      last_reviewed: params.lastReviewed,
      status: params.status,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,card_key' }
  );

  await client.from('review_logs').upsert(
    {
      user_id: userId,
      card_key: params.cardKey,
      rating: params.rating,
      reviewed_at: params.lastReviewed || new Date().toISOString(),
      interval: params.interval,
      ease_factor: params.easeFactor,
    },
    { onConflict: 'user_id,card_key,reviewed_at', ignoreDuplicates: true }
  );

  return true;
}

export async function batchUpsertSupabaseReviews(reviews: Array<any>): Promise<boolean> {
  const ctx = await getSupabaseServerClient();
  if (!ctx) return false;

  const { client, userId } = ctx;

  const progressRows = reviews.map((r: any) => ({
    user_id: userId,
    card_key: r.card_key,
    repetition: r.repetition,
    interval: r.interval,
    ease_factor: r.ease_factor,
    due_date: r.due_date,
    last_reviewed: r.reviewed_at,
    status: r.status,
    updated_at: new Date().toISOString(),
  }));

  await client
    .from('card_progress')
    .upsert(progressRows, { onConflict: 'user_id,card_key' });

  const logRows = reviews.map((r: any) => ({
    user_id: userId,
    card_key: r.card_key,
    rating: r.rating,
    reviewed_at: r.reviewed_at,
    interval: r.interval,
    ease_factor: r.ease_factor,
  }));

  await client
    .from('review_logs')
    .upsert(logRows, { onConflict: 'user_id,card_key,reviewed_at', ignoreDuplicates: true });

  return true;
}

export async function upsertSupabaseLifeQuestion(questionId: number): Promise<boolean> {
  const ctx = await getSupabaseServerClient();
  if (!ctx) return false;

  await ctx.client.from('life_question_progress').upsert(
    {
      user_id: ctx.userId,
      question_id: Number(questionId),
      completed: true,
      last_practiced: new Date().toISOString(),
    },
    { onConflict: 'user_id,question_id' }
  );

  return true;
}

export async function deleteSupabaseUserProgress(): Promise<boolean> {
  const ctx = await getSupabaseServerClient();
  if (!ctx) return false;

  const { client, userId } = ctx;
  await Promise.all([
    client.from('card_progress').delete().eq('user_id', userId),
    client.from('review_logs').delete().eq('user_id', userId),
    client.from('life_question_progress').delete().eq('user_id', userId),
  ]);
  return true;
}

