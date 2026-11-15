// @vitest-environment node

import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  isSupabaseConfigured: vi.fn(),
  getAuthenticatedSupabaseServerClient: vi.fn(),
}));

vi.mock('@/repositories/supabase/server.client', () => ({
  isSupabaseConfigured: mocks.isSupabaseConfigured,
  getAuthenticatedSupabaseServerClient: mocks.getAuthenticatedSupabaseServerClient,
}));

import { rejectGuest } from '@/services/guest-guard';

describe('rejectGuest', () => {
  it('returns null when Supabase is not configured', async () => {
    mocks.isSupabaseConfigured.mockReturnValue(false);

    await expect(rejectGuest()).resolves.toBeNull();
    expect(mocks.getAuthenticatedSupabaseServerClient).not.toHaveBeenCalled();
  });

  it('returns null when the user is authenticated', async () => {
    mocks.isSupabaseConfigured.mockReturnValue(true);
    mocks.getAuthenticatedSupabaseServerClient.mockResolvedValue({ client: {}, userId: 'u1' });

    await expect(rejectGuest()).resolves.toBeNull();
  });

  it('returns a 401 response for guests', async () => {
    mocks.isSupabaseConfigured.mockReturnValue(true);
    mocks.getAuthenticatedSupabaseServerClient.mockResolvedValue(null);

    const res = await rejectGuest();

    expect(res).not.toBeNull();
    expect(res!.status).toBe(401);
    await expect(res!.json()).resolves.toEqual({ ok: false, error: 'Unauthorized' });
  });
});
