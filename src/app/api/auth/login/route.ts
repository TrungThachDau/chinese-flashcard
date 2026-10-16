import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import {
  usernameToAuthEmail,
  validateUsername,
  getDisplayUsername,
} from '@/utils/supabase/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawUsername = typeof body.username === 'string' ? body.username.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    const validation = validateUsername(rawUsername);
    if (!validation.valid) {
      return NextResponse.json(
        { ok: false, error: validation.error },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { ok: false, error: 'Mật khẩu phải có ít nhất 6 ký tự.' },
        { status: 400 }
      );
    }

    const email = usernameToAuthEmail(rawUsername);
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      let friendlyMessage = 'Tên đăng nhập hoặc mật khẩu không đúng.';
      if (error.message.toLowerCase().includes('email not confirmed')) {
        friendlyMessage =
          'Tài khoản chưa được kích hoạt xác thực. Hãy tắt "Confirm email" trong Supabase Dashboard (Authentication → Providers → Email) hoặc chạy lại file supabase/schema.sql.';
      } else if (error.message.toLowerCase().includes('rate limit')) {
        friendlyMessage = 'Bạn đã thử quá nhiều lần. Vui lòng đợi ít phút rồi thử lại.';
      }

      return NextResponse.json(
        { ok: false, error: friendlyMessage, details: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: data.user.id,
        username: getDisplayUsername(data.user),
        email: data.user.email,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json(
      { ok: false, error: 'Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại.' },
      { status: 500 }
    );
  }
}
