import { NextResponse } from 'next/server';
import { getCurrentAuthenticatedUser } from '@/services/auth.service';

export async function GET() {
  try {
    const user = await getCurrentAuthenticatedUser();
    return NextResponse.json(
      { ok: true, user },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch {
    return NextResponse.json({ ok: true, user: null }, { headers: { 'Cache-Control': 'no-store' } });
  }
}
