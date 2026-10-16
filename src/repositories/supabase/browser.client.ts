import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const PERSISTENT_COOKIE_OPTIONS = {
  path: '/',
  sameSite: 'lax' as const,
  httpOnly: false,
  maxAge: 400 * 24 * 60 * 60, // 400 days (browser maximum for persistent cookies)
};

let browserClientInstance: SupabaseClient | null = null;

export const createBrowserSupabaseClient = (): SupabaseClient | null => {
  if (!supabaseUrl || !supabaseKey) return null;
  if (!browserClientInstance) {
    browserClientInstance = createBrowserClient(supabaseUrl, supabaseKey, {
      cookieOptions: PERSISTENT_COOKIE_OPTIONS,
    });
  }
  return browserClientInstance;
};


