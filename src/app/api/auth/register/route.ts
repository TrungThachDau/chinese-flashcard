import { NextRequest, NextResponse } from 'next/server';
import { registerWithUsername } from '@/services/auth.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawUsername = typeof body.username === 'string' ? body.username.trim() : '';
    const displayName =
      typeof body.displayName === 'string' && body.displayName.trim()
        ? body.displayName.trim()
        : rawUsername;
    const password = typeof body.password === 'string' ? body.password : '';

    const result = await registerWithUsername(rawUsername, displayName, password);
    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: result.error,
          needsConfirmationConfig: result.needsConfirmationConfig,
        },
        { status: result.status }
      );
    }

    return NextResponse.json({
      ok: true,
      user: result.user,
    });
  } catch (err: any) {
    console.error('Register error:', err);
    return NextResponse.json(
      { ok: false, error: 'Đã xảy ra lỗi khi tạo tài khoản. Vui lòng thử lại.' },
      { status: 500 }
    );
  }
}
