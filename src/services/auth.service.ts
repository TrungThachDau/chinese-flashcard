import { cookies } from 'next/headers';
import { AuthUser, DEFAULT_USER_SETTINGS } from '@/models';
import {
  createServerSupabaseClient,
  createAdminSupabaseClient,
} from '@/repositories/supabase/server.client';

export const USERNAME_EMAIL_DOMAIN = 'hanngu.app';

/**
 * Normalize a username or email into the identifier expected by Supabase Auth.
 */
export function usernameToAuthEmail(input: string): string {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return '';
  if (trimmed.includes('@')) {
    return trimmed;
  }
  return `${trimmed}@${USERNAME_EMAIL_DOMAIN}`;
}

/**
 * Extract displayable username from Supabase user object or auth email.
 */
export function getDisplayUsername(user: {
  email?: string | null;
  user_metadata?: Record<string, any> | null;
} | null | undefined): string {
  if (!user) return '';
  if (user.user_metadata?.username && typeof user.user_metadata.username === 'string') {
    return user.user_metadata.username;
  }
  if (user.user_metadata?.display_name && typeof user.user_metadata.display_name === 'string') {
    return user.user_metadata.display_name;
  }
  if (user.email) {
    if (user.email.endsWith(`@${USERNAME_EMAIL_DOMAIN}`)) {
      return user.email.slice(0, -(USERNAME_EMAIL_DOMAIN.length + 1));
    }
    return user.email.split('@')[0];
  }
  return '';
}

/**
 * Validate username format (allows letters, numbers, underscores, dots, hyphens, 3-30 chars, or valid email).
 */
export function validateUsername(input: string): { valid: boolean; error?: string } {
  const trimmed = input.trim();
  if (!trimmed) {
    return { valid: false, error: 'Vui lòng nhập tên đăng nhập.' };
  }
  if (trimmed.length < 3) {
    return { valid: false, error: 'Tên đăng nhập phải có ít nhất 3 ký tự.' };
  }
  if (trimmed.includes('@')) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return { valid: false, error: 'Định dạng email không hợp lệ.' };
    }
    return { valid: true };
  }
  if (trimmed.length > 30) {
    return { valid: false, error: 'Tên đăng nhập không được quá 30 ký tự.' };
  }
  const usernameRegex = /^[a-zA-Z0-9_.-]+$/;
  if (!usernameRegex.test(trimmed)) {
    return {
      valid: false,
      error: 'Tên đăng nhập chỉ được chứa chữ cái không dấu, số và ký tự _ . -',
    };
  }
  return { valid: true };
}

export async function loginWithUsername(rawUsername: string, password: string) {
  const validation = validateUsername(rawUsername);
  if (!validation.valid) {
    return { ok: false as const, status: 400, error: validation.error! };
  }

  if (!password || password.length < 6) {
    return {
      ok: false as const,
      status: 400,
      error: 'Mật khẩu phải có ít nhất 6 ký tự.',
    };
  }

  const email = usernameToAuthEmail(rawUsername);
  const cookieStore = await cookies();
  const supabase = createServerSupabaseClient(cookieStore);

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

    return {
      ok: false as const,
      status: 401,
      error: friendlyMessage,
      details: error.message,
    };
  }

  const user: AuthUser = {
    id: data.user.id,
    username: getDisplayUsername(data.user),
    email: data.user.email,
  };

  return { ok: true as const, status: 200, user };
}

export async function registerWithUsername(
  rawUsername: string,
  displayNameInput: string,
  password: string
) {
  const displayName = displayNameInput.trim() || rawUsername.trim();
  const validation = validateUsername(rawUsername);
  if (!validation.valid) {
    return { ok: false as const, status: 400, error: validation.error! };
  }

  if (!password || password.length < 6) {
    return {
      ok: false as const,
      status: 400,
      error: 'Mật khẩu phải có ít nhất 6 ký tự.',
    };
  }

  const email = usernameToAuthEmail(rawUsername);
  const normalizedUsername = rawUsername.trim().toLowerCase();
  const cookieStore = await cookies();
  const supabase = createServerSupabaseClient(cookieStore);

  const adminClient = createAdminSupabaseClient();

  if (adminClient) {
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
        return {
          ok: false as const,
          status: 409,
          error: 'Tên đăng nhập này đã được sử dụng. Vui lòng chọn tên khác.',
        };
      }
      return { ok: false as const, status: 400, error: adminErr.message };
    }

    const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInErr || !signInData.user) {
      return {
        ok: false as const,
        status: 400,
        error: signInErr?.message || 'Đăng nhập tự động sau đăng ký thất bại.',
      };
    }

    await supabase.from('user_settings').upsert({
      user_id: signInData.user.id,
      settings: {
        ...DEFAULT_USER_SETTINGS,
        user_name: displayName,
      },
      updated_at: new Date().toISOString(),
    });

    return {
      ok: true as const,
      status: 200,
      user: {
        id: signInData.user.id,
        username: getDisplayUsername(signInData.user),
        email: signInData.user.email,
      },
    };
  }

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
    return { ok: false as const, status: 400, error: friendlyError };
  }

  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    return {
      ok: false as const,
      status: 409,
      error: 'Tên đăng nhập này đã tồn tại. Vui lòng chuyển sang đăng nhập.',
    };
  }

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
    return {
      ok: false as const,
      status: 400,
      needsConfirmationConfig: true,
      error:
        'Tài khoản đã được tạo nhưng Supabase đang bật "Confirm email". Hãy tắt "Confirm email" trong Supabase Dashboard (Authentication → Providers → Email) hoặc chạy file supabase/schema.sql trong SQL Editor để tự động kích hoạt đăng nhập bằng Username.',
    };
  }

  if (activeUser) {
    await supabase.from('user_settings').upsert({
      user_id: activeUser.id,
      settings: {
        ...DEFAULT_USER_SETTINGS,
        user_name: displayName,
      },
      updated_at: new Date().toISOString(),
    });
  }

  return {
    ok: true as const,
    status: 200,
    user: activeUser
      ? {
          id: activeUser.id,
          username: getDisplayUsername(activeUser),
          email: activeUser.email,
        }
      : null,
  };
}

export async function logoutCurrentUser(): Promise<void> {
  const cookieStore = await cookies();
  const supabase = createServerSupabaseClient(cookieStore);
  await supabase.auth.signOut();
}

export async function getCurrentAuthenticatedUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerSupabaseClient(cookieStore);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const username = getDisplayUsername(user);
    return {
      id: user.id,
      username,
      displayName: user.user_metadata?.display_name || username,
      email: user.email,
    };
  } catch {
    return null;
  }
}

