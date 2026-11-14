import { NextResponse } from 'next/server';
import {
  getAuthenticatedSupabaseServerClient,
  isSupabaseConfigured,
} from '@/repositories/supabase/server.client';

/**
 * When accounts are enabled, visitors without a session are guests whose data lives
 * in their own browser. Returns a 401 response for them so server routes never read or
 * write the shared local database on a guest's behalf.
 */
export async function rejectGuest(): Promise<NextResponse | null> {
  if (!isSupabaseConfigured()) return null;
  const ctx = await getAuthenticatedSupabaseServerClient();
  if (ctx) return null;
  return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
}
