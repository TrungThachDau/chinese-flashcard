import { NextResponse } from 'next/server';
import { resetDatabase } from '@/lib/db';
import { getSupabaseServerClient } from '@/lib/supabaseAppData';

export async function POST() {
  try {
    const ctx = await getSupabaseServerClient();
    if (ctx) {
      const { client, userId } = ctx;
      await Promise.all([
        client.from('card_progress').delete().eq('user_id', userId),
        client.from('review_logs').delete().eq('user_id', userId),
        client.from('life_question_progress').delete().eq('user_id', userId),
      ]);
      return NextResponse.json({
        ok: true,
        message: 'Đã khôi phục tiến độ học của tài khoản về ban đầu.',
      });
    }

    resetDatabase();
    return NextResponse.json({ ok: true, message: 'Database reset and re-seeded successfully' });
  } catch (error) {
    console.error('Error resetting database:', error);
    return NextResponse.json({ ok: false, error: 'Failed to reset database' }, { status: 500 });
  }
}

