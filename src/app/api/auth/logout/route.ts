import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    await supabase.auth.signOut();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Logout error:', err);
    return NextResponse.json({ ok: false, error: 'Failed to sign out' }, { status: 500 });
  }
}
