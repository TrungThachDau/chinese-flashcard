import { cache } from 'react';
import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseJsClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const SERVER_COOKIE_OPTIONS = {
  path: '/',
  sameSite: 'lax' as const,
  httpOnly: false,
  maxAge: 400 * 24 * 60 * 60, // 400 days persistent cookie
};

export const createServerSupabaseClient = (
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  config?: { allowCookieDelete?: boolean }
) => {
  const allowDelete = Boolean(config?.allowCookieDelete);

  return createServerClient(supabaseUrl!, supabaseKey!, {
    cookieOptions: SERVER_COOKIE_OPTIONS,
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            const isDelete = !value || options?.maxAge === 0;
            if (isDelete && !allowDelete) {
              // Prevent concurrent API route requests or transient refresh races
              // from accidentally wiping out the user's active session cookies.
              return;
            }
            cookieStore.set(name, value, {
              ...SERVER_COOKIE_OPTIONS,
              ...options,
              maxAge: isDelete ? 0 : (options?.maxAge ?? SERVER_COOKIE_OPTIONS.maxAge),
            });
          });
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored as middleware/browser client refreshes user sessions.
        }
      },
    },
  });
};

export const createAdminSupabaseClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;

  return createSupabaseJsClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
};

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
  );
}

const USERNAME_EMAIL_DOMAIN = 'hanngu.app';

function extractUsername(user: {
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

export const getSupabaseServerClient = cache(async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const defaultUserId = process.env.SUPABASE_USER_ID;

  if (!url || (!serviceRoleKey && !anonKey)) {
    return null;
  }

  // 1. Try cookie-based client first if authenticated session exists
  try {
    const cookieStore = await cookies();
    const cookieClient = createServerSupabaseClient(cookieStore, { allowCookieDelete: false });
    const {
      data: { user },
    } = await cookieClient.auth.getUser();
    if (user) {
      const uname = extractUsername(user);
      return {
        client: cookieClient,
        userId: user.id,
        username: uname,
        displayName: user.user_metadata?.display_name || uname,
      };
    }
  } catch {
    // No cookie context (e.g. static rendering or background task)
  }

  // 2. Service role client with defaultUserId from env (optional CLI/migration fallback)
  if (serviceRoleKey && defaultUserId) {
    const client = createSupabaseJsClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    return { client, userId: defaultUserId, username: null, displayName: null };
  }

  // 3. Anon key with defaultUserId
  if (anonKey && defaultUserId) {
    const client = createSupabaseJsClient(url, anonKey, {
      auth: { persistSession: false },
    });
    return { client, userId: defaultUserId, username: null, displayName: null };
  }

  return null;
});

export const getAuthenticatedSupabaseServerClient = cache(async () => {
  if (!supabaseUrl || !supabaseKey) return null;

  const cookieStore = await cookies();
  const client = createServerSupabaseClient(cookieStore, { allowCookieDelete: false });
  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error || !user) return null;

  const username = extractUsername(user);
  return {
    client,
    userId: user.id,
    username,
    displayName: user.user_metadata?.display_name || username,
  };
});
