import { NextRequest, NextResponse } from 'next/server';
import { connection } from 'next/server';
import {
  fetchLifeQuestions,
  submitLifeQuestionPractice,
} from '@/services/life-question.service';
import { rejectGuest } from '@/services/guest-guard';

export async function GET() {
  await connection();
  const blocked = await rejectGuest();
  if (blocked) return blocked;
  try {
    const questions = await fetchLifeQuestions();
    return NextResponse.json(
      { ok: true, questions },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Error fetching life questions:', error);
    return NextResponse.json({ ok: false, error: 'Failed to fetch life questions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const blocked = await rejectGuest();
  if (blocked) return blocked;
  try {
    const body = await request.json();
    const { questionId } = body;

    if (!questionId) {
      return NextResponse.json({ ok: false, error: 'Missing questionId' }, { status: 400 });
    }

    await submitLifeQuestionPractice(Number(questionId));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error recording life question:', error);
    return NextResponse.json({ ok: false, error: 'Failed to update life question' }, { status: 500 });
  }
}
