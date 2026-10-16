import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient as createAdminClient } from '@supabase/supabase-js';
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
    const displayName =
      typeof body.displayName === 'string' && body.displayName.trim()
        ? body.displayName.trim()
        : rawUsername;
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
    const normalizedUsername = rawUsername.toLowerCase();
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // If service role key is configured, create user with email_confirm: true so username+pw works immediately
    if (supabaseUrl && serviceRoleKey) {
      const adminClient = createAdminClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const { error: adminErr } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          username: normalizedUsername,
          display_name: displayName,
        },
      });

      if (adminErr) {
        if (
          adminErr.message.toLowerCase().includes('already') ||
          adminErr.message.toLowerCase().includes('exists')
        ) {
          return NextResponse.json(
            { ok: false, error: 'Tên đăng nhập này đã được sử dụng. Vui lòng chọn tên khác.' },
            { status: 409 }
          );
        }
        return NextResponse.json(
          { ok: false, error: adminErr.message },
          { status: 400 }
        );
      }

      // Sign in immediately to set session cookies
      const { data: signInData, error: signInErr } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (signInErr || !signInData.user) {
        return NextResponse.json(
          { ok: false, error: signInErr?.message || 'Đăng nhập tự động sau đăng ký thất bại.' },
          { status: 400 }
        );
      }

      // Initialize default user_settings for the new user
      await supabase.from('user_settings').upsert({
        user_id: signInData.user.id,
        settings: {
          user_name: displayName,
          daily_limit: 15,
          speech_rate: 0.85,
          audio_engine: 'online',
          auto_play_audio: false,
          has_onboarded: false,
          hsk_level: 1,
          fsrs_retention: 0.9,
        },
        updated_at: new Date().toISOString(),
      });

      return NextResponse.json({
        ok: true,
        user: {
          id: signInData.user.id,
          username: getDisplayUsername(signInData.user),
          email: signInData.user.email,
        },
      });
    }

    // Standard signUp flow (works with publishable/anon key)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: normalizedUsername,
          display_name: displayName,
        },
      },
    });

    if (error) {
      let friendlyError = error.message;
      if (
        error.message.toLowerCase().includes('already registered') ||
        error.message.toLowerCase().includes('already exists')
      ) {
        friendlyError = 'Tên đăng nhập này đã tồn tại. Vui lòng đăng nhập hoặc chọn tên khác.';
      } else if (error.message.toLowerCase().includes('rate limit')) {
        friendlyError =
          'Vượt giới hạn tạo tài khoản tạm thời của Supabase. Hãy tắt "Confirm email" trong Supabase Dashboard hoặc thử lại sau ít phút.';
      }
      return NextResponse.json(
        { ok: false, error: friendlyError },
        { status: 400 }
      );
    }

    // Check if Supabase returned a fake/empty identities array (happens when email already exists and Confirm Email is on)
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Tên đăng nhập này đã tồn tại. Vui lòng chuyển sang đăng nhập.' },
        { status: 409 }
      );
    }

    // If session is null (e.g., Confirm email is enabled on Supabase and trigger not yet applied), try signing in once in case auto-confirm trigger confirmed it
    let activeUser = data.user;
    let hasSession = Boolean(data.session);

    if (!hasSession && data.user) {
      const { data: retrySignIn } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (retrySignIn?.session && retrySignIn.user) {
        activeUser = retrySignIn.user;
        hasSession = true;
      }
    }

    if (!hasSession) {
      return NextResponse.json(
        {
          ok: false,
          needsConfirmationConfig: true,
          error:
            'Tài khoản đã được tạo nhưng Supabase đang bật "Confirm email". Hãy tắt "Confirm email" trong Supabase Dashboard (Authentication → Providers → Email) hoặc chạy file supabase/schema.sql trong SQL Editor để tự động kích hoạt đăng nhập bằng Username.',
        },
        { status: 400 }
      );
    }

    if (activeUser) {
      await supabase.from('user_settings').upsert({
        user_id: activeUser.id,
        settings: {
          user_name: displayName,
          daily_limit: 15,
          speech_rate: 0.85,
          audio_engine: 'online',
          auto_play_audio: false,
          has_onboarded: false,
          hsk_level: 1,
          fsrs_retention: 0.9,
        },
        updated_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      ok: true,
      user: activeUser
        ? {
            id: activeUser.id,
            username: getDisplayUsername(activeUser),
            email: activeUser.email,
          }
        : null,
    });
  } catch (err: any) {
    console.error('Register error:', err);
    return NextResponse.json(
      { ok: false, error: 'Đã xảy ra lỗi khi tạo tài khoản. Vui lòng thử lại.' },
      { status: 500 }
    );
  }
}
