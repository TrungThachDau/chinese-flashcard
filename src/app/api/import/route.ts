import { NextRequest, NextResponse } from 'next/server';
import { connection } from 'next/server';
import { ProgressBackup } from '@/models';
import { importProgress } from '@/services/backup.service';
import { rejectGuest } from '@/services/guest-guard';

/** Restore a backup produced by GET /api/export. Idempotent. */
export async function POST(request: NextRequest) {
  await connection();
  const blocked = await rejectGuest();
  if (blocked) return blocked;
  try {
    const backup = (await request.json()) as ProgressBackup;
    const result = importProgress(backup);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to import progress';
    console.error('Error importing progress:', error);
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
