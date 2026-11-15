// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_USER_SETTINGS } from '@/models';
import {
  getCurrentAuthenticatedUser,
  getDisplayUsername,
  loginWithUsername,
  logoutCurrentUser,
  registerWithUsername,
  usernameToAuthEmail,
  validateUsername,
} from '@/services/auth.service';
import {
  createAdminSupabaseClient,
  createServerSupabaseClient,
} from '@/repositories/supabase/server.client';

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({ fake: 'cookie-store' })),
}));

vi.mock('@/repositories/supabase/server.client', () => ({
  createServerSupabaseClient: vi.fn(),
  createAdminSupabaseClient: vi.fn(),
}));

const PASSWORD_ERROR = 'Mật khẩu phải có ít nhất 6 ký tự.';

function createFakeServerClient() {
  const upsert = vi.fn(async () => ({ error: null }));
  const from = vi.fn(() => ({ upsert }));
  const auth = {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(async () => ({ error: null })),
    getUser: vi.fn(),
  };
  return { auth, from, upsert };
}

function createFakeAdminClient() {
  return {
    auth: {
      admin: {
        createUser: vi.fn(),
      },
    },
  };
}

let server: ReturnType<typeof createFakeServerClient>;

beforeEach(() => {
  server = createFakeServerClient();
  vi.mocked(createServerSupabaseClient).mockReturnValue(server as never);
  vi.mocked(createAdminSupabaseClient).mockReturnValue(null as never);
});

describe('usernameToAuthEmail', () => {
  it('returns empty string for blank input', () => {
    expect(usernameToAuthEmail('   ')).toBe('');
  });

  it('keeps email inputs as-is (normalized)', () => {
    expect(usernameToAuthEmail('  John@Example.COM ')).toBe('john@example.com');
  });

  it('appends the username domain', () => {
    expect(usernameToAuthEmail(' Alice ')).toBe('alice@hanngu.app');
  });
});

describe('getDisplayUsername', () => {
  it('returns empty string for missing user', () => {
    expect(getDisplayUsername(null)).toBe('');
    expect(getDisplayUsername(undefined)).toBe('');
  });

  it('prefers username metadata', () => {
    expect(
      getDisplayUsername({ email: 'x@y.z', user_metadata: { username: 'alice', display_name: 'A' } })
    ).toBe('alice');
  });

  it('falls back to display_name when username is not a string', () => {
    expect(getDisplayUsername({ user_metadata: { username: 123, display_name: 'Alice' } })).toBe(
      'Alice'
    );
  });

  it('strips the internal domain from email', () => {
    expect(getDisplayUsername({ email: 'bob@hanngu.app', user_metadata: { display_name: 5 } })).toBe(
      'bob'
    );
  });

  it('uses the local part of other emails', () => {
    expect(getDisplayUsername({ email: 'carol@gmail.com', user_metadata: null })).toBe('carol');
  });

  it('returns empty string without email or metadata', () => {
    expect(getDisplayUsername({ email: null })).toBe('');
  });
});

describe('validateUsername', () => {
  it('rejects empty input', () => {
    expect(validateUsername('  ')).toEqual({ valid: false, error: 'Vui lòng nhập tên đăng nhập.' });
  });

  it('rejects too short input', () => {
    expect(validateUsername('ab')).toEqual({
      valid: false,
      error: 'Tên đăng nhập phải có ít nhất 3 ký tự.',
    });
  });

  it('rejects invalid emails', () => {
    expect(validateUsername('bad@email')).toEqual({
      valid: false,
      error: 'Định dạng email không hợp lệ.',
    });
  });

  it('accepts valid emails', () => {
    expect(validateUsername('good@email.com')).toEqual({ valid: true });
  });

  it('rejects too long usernames', () => {
    expect(validateUsername('a'.repeat(31))).toEqual({
      valid: false,
      error: 'Tên đăng nhập không được quá 30 ký tự.',
    });
  });

  it('rejects usernames with invalid characters', () => {
    expect(validateUsername('hà nội')).toEqual({
      valid: false,
      error: 'Tên đăng nhập chỉ được chứa chữ cái không dấu, số và ký tự _ . -',
    });
  });

  it('accepts valid usernames', () => {
    expect(validateUsername('user_name.1-2')).toEqual({ valid: true });
  });
});

describe('loginWithUsername', () => {
  it('returns validation error for invalid username', async () => {
    await expect(loginWithUsername('', 'secret1')).resolves.toEqual({
      ok: false,
      status: 400,
      error: 'Vui lòng nhập tên đăng nhập.',
    });
    expect(createServerSupabaseClient).not.toHaveBeenCalled();
  });

  it('rejects empty or short passwords', async () => {
    await expect(loginWithUsername('alice', '')).resolves.toEqual({
      ok: false,
      status: 400,
      error: PASSWORD_ERROR,
    });
    await expect(loginWithUsername('alice', '123')).resolves.toEqual({
      ok: false,
      status: 400,
      error: PASSWORD_ERROR,
    });
  });

  it('maps "email not confirmed" errors', async () => {
    server.auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Email not confirmed' },
    });
    const result = await loginWithUsername('alice', 'secret1');
    expect(result.ok).toBe(false);
    expect(result.status).toBe(401);
    expect(result.error).toContain('Tài khoản chưa được kích hoạt xác thực');
    expect(result).toMatchObject({ details: 'Email not confirmed' });
    expect(server.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'alice@hanngu.app',
      password: 'secret1',
    });
  });

  it('maps rate limit errors', async () => {
    server.auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Request Rate Limit reached' },
    });
    const result = await loginWithUsername('alice', 'secret1');
    expect(result.error).toBe('Bạn đã thử quá nhiều lần. Vui lòng đợi ít phút rồi thử lại.');
  });

  it('uses a generic message for other errors', async () => {
    server.auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' },
    });
    const result = await loginWithUsername('alice', 'secret1');
    expect(result).toEqual({
      ok: false,
      status: 401,
      error: 'Tên đăng nhập hoặc mật khẩu không đúng.',
      details: 'Invalid login credentials',
    });
  });

  it('returns the user and session on success', async () => {
    server.auth.signInWithPassword.mockResolvedValue({
      data: {
        user: { id: 'u1', email: 'alice@hanngu.app', user_metadata: {} },
        session: { access_token: 'at', refresh_token: 'rt', extra: true },
      },
      error: null,
    });
    await expect(loginWithUsername('alice', 'secret1')).resolves.toEqual({
      ok: true,
      status: 200,
      user: { id: 'u1', username: 'alice', email: 'alice@hanngu.app' },
      session: { access_token: 'at', refresh_token: 'rt' },
    });
  });

  it('returns null session when none is provided', async () => {
    server.auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: 'u1', email: 'alice@hanngu.app' }, session: null },
      error: null,
    });
    const result = await loginWithUsername('alice', 'secret1');
    expect(result).toMatchObject({ ok: true, session: null });
  });
});

describe('registerWithUsername', () => {
  it('returns validation error for invalid username', async () => {
    await expect(registerWithUsername('ab', 'Name', 'secret1')).resolves.toEqual({
      ok: false,
      status: 400,
      error: 'Tên đăng nhập phải có ít nhất 3 ký tự.',
    });
  });

  it('rejects empty or short passwords', async () => {
    await expect(registerWithUsername('alice', 'Alice', '')).resolves.toEqual({
      ok: false,
      status: 400,
      error: PASSWORD_ERROR,
    });
    await expect(registerWithUsername('alice', 'Alice', '12345')).resolves.toEqual({
      ok: false,
      status: 400,
      error: PASSWORD_ERROR,
    });
  });

  describe('with admin client', () => {
    let admin: ReturnType<typeof createFakeAdminClient>;

    beforeEach(() => {
      admin = createFakeAdminClient();
      vi.mocked(createAdminSupabaseClient).mockReturnValue(admin as never);
    });

    it('returns 409 when the user already exists ("already")', async () => {
      admin.auth.admin.createUser.mockResolvedValue({
        error: { message: 'User Already registered' },
      });
      await expect(registerWithUsername('alice', 'Alice', 'secret1')).resolves.toEqual({
        ok: false,
        status: 409,
        error: 'Tên đăng nhập này đã được sử dụng. Vui lòng chọn tên khác.',
      });
    });

    it('returns 409 when the user already exists ("exists")', async () => {
      admin.auth.admin.createUser.mockResolvedValue({
        error: { message: 'Email EXISTS' },
      });
      const result = await registerWithUsername('alice', 'Alice', 'secret1');
      expect(result.status).toBe(409);
    });

    it('returns other admin errors as-is', async () => {
      admin.auth.admin.createUser.mockResolvedValue({ error: { message: 'Weak password' } });
      await expect(registerWithUsername('alice', 'Alice', 'secret1')).resolves.toEqual({
        ok: false,
        status: 400,
        error: 'Weak password',
      });
    });

    it('returns sign-in error message after creation', async () => {
      admin.auth.admin.createUser.mockResolvedValue({ error: null });
      server.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Sign-in failed' },
      });
      await expect(registerWithUsername('alice', 'Alice', 'secret1')).resolves.toEqual({
        ok: false,
        status: 400,
        error: 'Sign-in failed',
      });
    });

    it('returns default message when sign-in yields no user', async () => {
      admin.auth.admin.createUser.mockResolvedValue({ error: null });
      server.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      });
      await expect(registerWithUsername('alice', 'Alice', 'secret1')).resolves.toEqual({
        ok: false,
        status: 400,
        error: 'Đăng nhập tự động sau đăng ký thất bại.',
      });
    });

    it('creates user, signs in and stores settings', async () => {
      admin.auth.admin.createUser.mockResolvedValue({ error: null });
      server.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: { id: 'u1', email: 'alice@hanngu.app', user_metadata: { username: 'alice' } },
          session: { access_token: 'at', refresh_token: 'rt' },
        },
        error: null,
      });

      const result = await registerWithUsername('  Alice ', '  ', 'secret1');

      expect(admin.auth.admin.createUser).toHaveBeenCalledWith({
        email: 'alice@hanngu.app',
        password: 'secret1',
        email_confirm: true,
        user_metadata: { username: 'alice', display_name: 'Alice' },
      });
      expect(server.from).toHaveBeenCalledWith('user_settings');
      expect(server.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'u1',
          settings: { ...DEFAULT_USER_SETTINGS, user_name: 'Alice' },
          updated_at: expect.any(String),
        })
      );
      expect(result).toEqual({
        ok: true,
        status: 200,
        user: { id: 'u1', username: 'alice', email: 'alice@hanngu.app' },
        session: { access_token: 'at', refresh_token: 'rt' },
      });
    });

    it('returns null session when sign-in has none', async () => {
      admin.auth.admin.createUser.mockResolvedValue({ error: null });
      server.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'u1', email: 'alice@hanngu.app' }, session: null },
        error: null,
      });
      const result = await registerWithUsername('alice', 'Alice', 'secret1');
      expect(result).toMatchObject({ ok: true, session: null });
      expect(server.auth.signUp).not.toHaveBeenCalled();
    });
  });

  describe('without admin client (signUp flow)', () => {
    it('maps "already registered" errors', async () => {
      server.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'User already registered' },
      });
      await expect(registerWithUsername('alice', 'Alice', 'secret1')).resolves.toEqual({
        ok: false,
        status: 400,
        error: 'Tên đăng nhập này đã tồn tại. Vui lòng đăng nhập hoặc chọn tên khác.',
      });
    });

    it('maps "already exists" errors', async () => {
      server.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'User Already Exists' },
      });
      const result = await registerWithUsername('alice', 'Alice', 'secret1');
      expect(result.error).toBe(
        'Tên đăng nhập này đã tồn tại. Vui lòng đăng nhập hoặc chọn tên khác.'
      );
    });

    it('maps rate limit errors', async () => {
      server.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Email rate limit exceeded' },
      });
      const result = await registerWithUsername('alice', 'Alice', 'secret1');
      expect(result.error).toContain('Vượt giới hạn tạo tài khoản tạm thời của Supabase');
    });

    it('returns other signUp errors as-is', async () => {
      server.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Something broke' },
      });
      await expect(registerWithUsername('alice', 'Alice', 'secret1')).resolves.toEqual({
        ok: false,
        status: 400,
        error: 'Something broke',
      });
    });

    it('returns 409 when identities is empty', async () => {
      server.auth.signUp.mockResolvedValue({
        data: { user: { id: 'u1', identities: [] }, session: null },
        error: null,
      });
      await expect(registerWithUsername('alice', 'Alice', 'secret1')).resolves.toEqual({
        ok: false,
        status: 409,
        error: 'Tên đăng nhập này đã tồn tại. Vui lòng chuyển sang đăng nhập.',
      });
    });

    it('stores settings and returns session when signUp creates a session', async () => {
      server.auth.signUp.mockResolvedValue({
        data: {
          user: { id: 'u1', email: 'alice@hanngu.app', identities: [{ id: 'i1' }] },
          session: { access_token: 'at', refresh_token: 'rt' },
        },
        error: null,
      });

      const result = await registerWithUsername('Alice', 'Alice Nguyen', 'secret1');

      expect(server.auth.signUp).toHaveBeenCalledWith({
        email: 'alice@hanngu.app',
        password: 'secret1',
        options: { data: { username: 'alice', display_name: 'Alice Nguyen' } },
      });
      expect(server.auth.signInWithPassword).not.toHaveBeenCalled();
      expect(server.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'u1',
          settings: { ...DEFAULT_USER_SETTINGS, user_name: 'Alice Nguyen' },
        })
      );
      expect(result).toEqual({
        ok: true,
        status: 200,
        user: { id: 'u1', username: 'alice', email: 'alice@hanngu.app' },
        session: { access_token: 'at', refresh_token: 'rt' },
      });
    });

    it('retries sign-in when signUp returns no session', async () => {
      server.auth.signUp.mockResolvedValue({
        data: { user: { id: 'u1', email: 'alice@hanngu.app' }, session: null },
        error: null,
      });
      server.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: { id: 'u2', email: 'alice@hanngu.app', user_metadata: { username: 'alice2' } },
          session: { access_token: 'at2', refresh_token: 'rt2' },
        },
        error: null,
      });

      const result = await registerWithUsername('alice', 'Alice', 'secret1');

      expect(server.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'alice@hanngu.app',
        password: 'secret1',
      });
      expect(server.upsert).toHaveBeenCalledWith(expect.objectContaining({ user_id: 'u2' }));
      expect(result).toEqual({
        ok: true,
        status: 200,
        user: { id: 'u2', username: 'alice2', email: 'alice@hanngu.app' },
        session: { access_token: 'at2', refresh_token: 'rt2' },
      });
    });

    it('asks to configure confirmation when retry sign-in yields no session', async () => {
      server.auth.signUp.mockResolvedValue({
        data: { user: { id: 'u1' }, session: null },
        error: null,
      });
      server.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Email not confirmed' },
      });

      const result = await registerWithUsername('alice', 'Alice', 'secret1');

      expect(result).toMatchObject({ ok: false, status: 400, needsConfirmationConfig: true });
      expect(result.error).toContain('Confirm email');
      expect(server.upsert).not.toHaveBeenCalled();
    });

    it('does not accept retry with a session but without a user', async () => {
      server.auth.signUp.mockResolvedValue({
        data: { user: { id: 'u1' }, session: null },
        error: null,
      });
      server.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: { access_token: 'at', refresh_token: 'rt' } },
        error: null,
      });
      const result = await registerWithUsername('alice', 'Alice', 'secret1');
      expect(result).toMatchObject({ needsConfirmationConfig: true });
    });

    it('handles a retry sign-in that returns no data', async () => {
      server.auth.signUp.mockResolvedValue({
        data: { user: { id: 'u1' }, session: null },
        error: null,
      });
      server.auth.signInWithPassword.mockResolvedValue({ data: null, error: null });
      const result = await registerWithUsername('alice', 'Alice', 'secret1');
      expect(result).toMatchObject({ needsConfirmationConfig: true });
    });

    it('skips retry when there is neither a user nor a session', async () => {
      server.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      });
      const result = await registerWithUsername('alice', 'Alice', 'secret1');
      expect(server.auth.signInWithPassword).not.toHaveBeenCalled();
      expect(result).toMatchObject({ needsConfirmationConfig: true });
    });

    it('returns null user when session exists without a user', async () => {
      server.auth.signUp.mockResolvedValue({
        data: { user: null, session: { access_token: 'at', refresh_token: 'rt' } },
        error: null,
      });
      const result = await registerWithUsername('alice', 'Alice', 'secret1');
      expect(server.upsert).not.toHaveBeenCalled();
      expect(result).toEqual({
        ok: true,
        status: 200,
        user: null,
        session: { access_token: 'at', refresh_token: 'rt' },
      });
    });
  });
});

describe('logoutCurrentUser', () => {
  it('signs out locally with cookie deletion allowed', async () => {
    await logoutCurrentUser();
    expect(createServerSupabaseClient).toHaveBeenCalledWith(
      { fake: 'cookie-store' },
      { allowCookieDelete: true }
    );
    expect(server.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
  });
});

describe('getCurrentAuthenticatedUser', () => {
  it('returns null when no user is signed in', async () => {
    server.auth.getUser.mockResolvedValue({ data: { user: null } });
    await expect(getCurrentAuthenticatedUser()).resolves.toBeNull();
    expect(createServerSupabaseClient).toHaveBeenCalledWith(
      { fake: 'cookie-store' },
      { allowCookieDelete: false }
    );
  });

  it('returns the user with display name from metadata', async () => {
    server.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: 'u1',
          email: 'alice@hanngu.app',
          user_metadata: { username: 'alice', display_name: 'Alice N' },
        },
      },
    });
    await expect(getCurrentAuthenticatedUser()).resolves.toEqual({
      id: 'u1',
      username: 'alice',
      displayName: 'Alice N',
      email: 'alice@hanngu.app',
    });
  });

  it('falls back to username when no display name exists', async () => {
    server.auth.getUser.mockResolvedValue({
      data: { user: { id: 'u1', email: 'bob@hanngu.app' } },
    });
    await expect(getCurrentAuthenticatedUser()).resolves.toEqual({
      id: 'u1',
      username: 'bob',
      displayName: 'bob',
      email: 'bob@hanngu.app',
    });
  });

  it('returns null when an error is thrown', async () => {
    server.auth.getUser.mockRejectedValue(new Error('boom'));
    await expect(getCurrentAuthenticatedUser()).resolves.toBeNull();
  });
});
