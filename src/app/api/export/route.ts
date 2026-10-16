import { NextResponse } from 'next/server';
import { connection } from 'next/server';
import { exportProgress } from '@/services/backup.service';

/** Download all learner progress as a portable JSON backup (also the Supabase migration source). */
export async function GET() {
  await connection();
  try {
    const backup = exportProgress();
    const stamp = backup.exported_at.substring(0, 10);
    return new NextResponse(JSON.stringify(backup, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="flashcard-progress-${stamp}.json"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error exporting progress:', error);
    return NextResponse.json({ ok: false, error: 'Failed to export progress' }, { status: 500 });
  }
}
