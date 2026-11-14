import { NextRequest, NextResponse } from 'next/server';
import { connection } from 'next/server';
import { GuestImportPayload } from '@/models';
import { importGuestProgress } from '@/services/guest-import.service';

/** Import learning progress collected in guest mode into the signed-in account. */
export async function POST(request: NextRequest) {
  await connection();
  try {
    const body = (await request.json()) as GuestImportPayload;
    const result = await importGuestProgress(body);
    if (!result) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    console.error('Error importing guest progress:', error);
    return NextResponse.json({ ok: false, error: 'Failed to import guest progress' }, { status: 500 });
  }
}
