import { NextRequest, NextResponse } from 'next/server';
import { connection } from 'next/server';
import { getLifeQuestions, recordLifeQuestionPractice } from '@/lib/db';

export async function GET() {
  await connection();
  try {
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

    recordLifeQuestionPractice(questionId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error recording life question:', error);
    return NextResponse.json({ ok: false, error: 'Failed to update life question' }, { status: 500 });
  }
}

