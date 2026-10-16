import { NextRequest, NextResponse } from 'next/server';
import { connection } from 'next/server';
import { getLifeQuestions, recordLifeQuestionPractice } from '@/lib/db';
import { getSupabaseServerClient, loadSupabaseAppData } from '@/lib/supabaseAppData';

export async function GET() {
  await connection();
  try {
    const sbData = await loadSupabaseAppData({ includeQuestions: true });
    if (sbData?.lifeQuestions) {
      return NextResponse.json(
        { ok: true, questions: sbData.lifeQuestions },
        { headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const questions = getLifeQuestions();
    return NextResponse.json({ ok: true, questions });
  } catch (error) {
    console.error('Error fetching life questions:', error);
    return NextResponse.json({ ok: false, error: 'Failed to fetch life questions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questionId } = body;

    if (!questionId) {
      return NextResponse.json({ ok: false, error: 'Missing questionId' }, { status: 400 });
    }

    const ctx = await getSupabaseServerClient();
    if (ctx) {
      await ctx.client.from('life_question_progress').upsert(
        {
          user_id: ctx.userId,
          question_id: Number(questionId),
          completed: true,
          last_practiced: new Date().toISOString(),
        },
        { onConflict: 'user_id,question_id' }
      );
      return NextResponse.json({ ok: true });
    }

    recordLifeQuestionPractice(questionId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error recording life question:', error);
    return NextResponse.json({ ok: false, error: 'Failed to update life question' }, { status: 500 });
  }
}

