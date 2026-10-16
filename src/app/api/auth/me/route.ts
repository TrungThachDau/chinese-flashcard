import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { getDisplayUsername } from '@/utils/supabase/auth';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: true, user: null }, { headers: { 'Cache-Control': 'no-store' } });
    }

    return NextResponse.json(
      {
        ok: true,
        user: {
          id: user.id,
          username: getDisplayUsername(user),
          displayName: user.user_metadata?.display_name || getDisplayUsername(user),
          email: user.email,
        },
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch {
    return NextResponse.json({ ok: true, user: null }, { headers: { 'Cache-Control': 'no-store' } });
  }
}
