// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  completeQuestionApi,
  fetchCardsApi,
  fetchQuestionsApi,
  fetchStatsApi,
  isGuestMode,
  resetDataApi,
  saveSettingsApi,
  setGuestMode,
} from '@/services/client-api';
import {
  clearGuestData,
  completeGuestQuestion,
  getGuestQuestions,
  getGuestStats,
  queryGuestCards,
  saveGuestSettings,
} from '@/services/guest.service';

vi.mock('@/services/guest.service', () => ({
  clearGuestData: vi.fn(),
  getGuestQuestions: vi.fn(),
  getGuestStats: vi.fn(),
  queryGuestCards: vi.fn(),
  completeGuestQuestion: vi.fn(),
  saveGuestSettings: vi.fn(),
}));

const fetchMock = vi.fn();

function jsonResponse(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: vi.fn(async () => body),
  };
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  setGuestMode(false);
});

describe('guest mode flag', () => {
  it('defaults to false and can be toggled', () => {
    expect(isGuestMode()).toBe(false);
    setGuestMode(true);
    expect(isGuestMode()).toBe(true);
    setGuestMode(false);
    expect(isGuestMode()).toBe(false);
  });
});

describe('guest mode', () => {
  beforeEach(() => {
    setGuestMode(true);
  });

  it('queries guest cards from a string', async () => {
    vi.mocked(queryGuestCards).mockResolvedValue({ ok: true, cards: [] } as never);
    await expect(fetchCardsApi('level=1&page=2')).resolves.toEqual({ ok: true, cards: [] });
    const arg = vi.mocked(queryGuestCards).mock.calls[0][0] as URLSearchParams;
    expect(arg).toBeInstanceOf(URLSearchParams);
    expect(arg.toString()).toBe('level=1&page=2');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('queries guest cards from URLSearchParams', async () => {
    vi.mocked(queryGuestCards).mockResolvedValue({ ok: true } as never);
    await fetchCardsApi(new URLSearchParams({ q: 'ni' }));
    const arg = vi.mocked(queryGuestCards).mock.calls[0][0] as URLSearchParams;
    expect(arg.get('q')).toBe('ni');
  });

  it('returns guest stats', async () => {
    vi.mocked(getGuestStats).mockResolvedValue({ total: 3 } as never);
    await expect(fetchStatsApi()).resolves.toEqual({ ok: true, stats: { total: 3 } });
  });

  it('returns guest questions', async () => {
    vi.mocked(getGuestQuestions).mockResolvedValue([{ id: 1 }] as never);
    await expect(fetchQuestionsApi()).resolves.toEqual({ ok: true, questions: [{ id: 1 }] });
  });

  it('saves guest settings', async () => {
    vi.mocked(saveGuestSettings).mockResolvedValue({ daily_limit: 20 } as never);
    await expect(saveSettingsApi({ daily_limit: 20 })).resolves.toEqual({
      ok: true,
      settings: { daily_limit: 20 },
    });
    expect(saveGuestSettings).toHaveBeenCalledWith({ daily_limit: 20 });
  });

  it('clears guest data', async () => {
    await expect(resetDataApi()).resolves.toBeUndefined();
    expect(clearGuestData).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('completes guest question', async () => {
    await expect(completeQuestionApi(7)).resolves.toBeUndefined();
    expect(completeGuestQuestion).toHaveBeenCalledWith(7);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('API mode', () => {
  it('fetches cards with a string query', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true, cards: [1] }));
    await expect(fetchCardsApi('page=1')).resolves.toEqual({ ok: true, cards: [1] });
    expect(fetchMock).toHaveBeenCalledWith('/api/cards?page=1');
  });

  it('fetches cards with URLSearchParams', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));
    await fetchCardsApi(new URLSearchParams({ a: '1', b: '2' }));
    expect(fetchMock).toHaveBeenCalledWith('/api/cards?a=1&b=2');
  });

  it('fetches stats with timezone and no-store cache', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true, stats: {} }));
    await expect(fetchStatsApi()).resolves.toEqual({ ok: true, stats: {} });
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/stats?tz=${new Date().getTimezoneOffset()}`,
      { cache: 'no-store' }
    );
  });

  it('fetches questions', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true, questions: [] }));
    await expect(fetchQuestionsApi()).resolves.toEqual({ ok: true, questions: [] });
    expect(fetchMock).toHaveBeenCalledWith('/api/life-questions');
  });

  it('saves settings via POST', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true, settings: { hsk_level: 2 } }));
    await expect(saveSettingsApi({ hsk_level: 2 })).resolves.toEqual({
      ok: true,
      settings: { hsk_level: 2 },
    });
    expect(fetchMock).toHaveBeenCalledWith('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hsk_level: 2 }),
      keepalive: true,
    });
  });

  it('resets data via POST', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));
    await expect(resetDataApi()).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith('/api/reset', { method: 'POST' });
  });

  it('completes question via POST', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));
    await expect(completeQuestionApi(3)).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith('/api/life-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId: 3 }),
    });
  });

  it('throws the API error message when response is not ok', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: false, error: 'Unauthorized' }, { ok: false, status: 401 }));
    await expect(fetchQuestionsApi()).rejects.toThrow('Unauthorized');
  });

  it('throws when body ok is false even with a 200 response', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: false }));
    await expect(resetDataApi()).rejects.toThrow('Request failed with status 200');
  });

  it('throws a status message when JSON parsing fails', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn(async () => {
        throw new SyntaxError('bad json');
      }),
    });
    await expect(completeQuestionApi(1)).rejects.toThrow('Request failed with status 500');
  });
});
