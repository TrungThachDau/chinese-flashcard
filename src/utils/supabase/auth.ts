/**
 * Helpers for Username + Password authentication with Supabase Auth.
 *
 * Supabase Auth uses an `email` identifier under the hood.
 * When a user logs in or registers with a plain `username` (e.g. "trung_hsk"),
 * we deterministically map it to `<normalized_username>@hanngu.app`.
 * If the user enters a full email address, we use it directly.
 */

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
