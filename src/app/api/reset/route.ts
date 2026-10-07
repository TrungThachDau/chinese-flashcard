import { NextResponse } from 'next/server';
import { resetDatabase } from '@/lib/db';

export async function POST() {
  try {
    resetDatabase();
    return NextResponse.json({ ok: true, message: 'Database reset and re-seeded successfully' });
  } catch (error) {
    console.error('Error resetting database:', error);
    return NextResponse.json({ ok: false, error: 'Failed to reset database' }, { status: 500 });
  }
}

