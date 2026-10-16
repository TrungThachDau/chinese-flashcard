import { NextResponse } from 'next/server';
import { logoutCurrentUser } from '@/services/auth.service';

export async function POST() {
  try {
    await logoutCurrentUser();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Logout error:', err);
    return NextResponse.json({ ok: false, error: 'Failed to sign out' }, { status: 500 });
  }
}
