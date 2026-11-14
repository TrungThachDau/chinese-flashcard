import { NextResponse } from 'next/server';
import { resetUserOrLocalProgress } from '@/services/backup.service';
import { rejectGuest } from '@/services/guest-guard';

export async function POST() {
  const blocked = await rejectGuest();
  if (blocked) return blocked;
  try {
    const result = await resetUserOrLocalProgress();
    return NextResponse.json({ ok: true, message: result.message });
  } catch (error) {
    console.error('Error resetting database:', error);
    return NextResponse.json({ ok: false, error: 'Failed to reset database' }, { status: 500 });
  }
}
