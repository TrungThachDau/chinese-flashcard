// @vitest-environment node

import { describe, expect, it } from 'vitest';
import {
  calculateFSRS,
  calculateSM2,
  formatFSRSDuePreview,
  formatIntervalPreview,
  getIntervalPreviews,
} from '@/services/srs.service';

describe('SRS service', () => {
  const now = new Date('2026-01-01T00:00:00.000Z');

  it('formats interval previews', () => {
    expect(formatIntervalPreview(0)).toBe('Hôm nay');
    expect(formatIntervalPreview(1)).toBe('1 ngày');
    expect(formatIntervalPreview(30)).toBe('1 tháng');
  });

  it('formats FSRS due previews', () => {
    expect(formatFSRSDuePreview(new Date(now.getTime() + 10 * 60_000), now, 0)).toBe('10 phút');
    expect(formatFSRSDuePreview(new Date(now.getTime()), now, 30)).toBe('1 tháng');
  });

  it('calculates SM-2 results using the supplied date', () => {
    const result = calculateSM2({ repetition: 1, interval: 1, ease_factor: 2.5 }, 3, now);

    expect(result).toMatchObject({ repetition: 2, interval: 6, ease_factor: 2.5 });
    expect(result.due_date).toBe('2026-01-07T00:00:00.000Z');
  });

  it('calculates FSRS results for a new card', () => {
    const result = calculateFSRS({ status: 'new' }, 3, now);

    expect(result.status).toBe('learning');
    expect(Number.isNaN(Date.parse(result.due_date))).toBe(false);
    expect(result.due_date).not.toBe(now.toISOString());
  });

  it('returns default previews when there is no card', () => {
    expect(getIntervalPreviews(null)).toEqual({
      1: '< 1 phút',
      2: '6 phút',
      3: '10 phút',
      4: '8 ngày',
    });
  });
});