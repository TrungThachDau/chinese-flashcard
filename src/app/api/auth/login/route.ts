import { NextRequest, NextResponse } from 'next/server';
import { loginWithUsername } from '@/services/auth.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawUsername = typeof body.username === 'string' ? body.username.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    const result = await loginWithUsername(rawUsername, password);
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error, details: result.details },
        { status: result.status }
      );
    }

    return NextResponse.json({
      ok: true,
      user: result.user,
      session: result.session,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json(
      { ok: false, error: 'Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại.' },
      { status: 500 }
    );
  }
}
