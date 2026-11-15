// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest';
import { State } from 'ts-fsrs';
import {
  calculateFSRS,
  calculateSM2,
  formatFSRSDuePreview,
  formatIntervalPreview,
  getCardRetrievability,
  getIntervalPreviews,
  toFSRSCard,
} from '@/services/srs.service';

const DAY = 24 * 60 * 60 * 1000;

describe('SRS service', () => {
  const now = new Date('2026-01-01T00:00:00.000Z');

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('formatIntervalPreview', () => {
    it('formats every interval range', () => {
      expect(formatIntervalPreview(-1)).toBe('Hôm nay');
      expect(formatIntervalPreview(0)).toBe('Hôm nay');
      expect(formatIntervalPreview(1)).toBe('1 ngày');
      expect(formatIntervalPreview(12)).toBe('12 ngày');
      expect(formatIntervalPreview(30)).toBe('1 tháng');
      expect(formatIntervalPreview(95)).toBe('3 tháng');
    });
  });

  describe('formatFSRSDuePreview', () => {
    it('formats scheduled days', () => {
      expect(formatFSRSDuePreview(now, now, 1)).toBe('1 ngày');
      expect(formatFSRSDuePreview(now, now, 7)).toBe('7 ngày');
      expect(formatFSRSDuePreview(now, now, 30)).toBe('1 tháng');
      expect(formatFSRSDuePreview(now, now, 300)).toBe('10 tháng');
      expect(formatFSRSDuePreview(now, now, 730)).toBe('2.0 năm');
    });

    it('formats short-term due times', () => {
      const at = (ms: number) => new Date(now.getTime() + ms);
      expect(formatFSRSDuePreview(at(-60_000), now, 0)).toBe('< 1 phút');
      expect(formatFSRSDuePreview(at(60_000), now, 0)).toBe('< 1 phút');
      expect(formatFSRSDuePreview(at(10 * 60_000), now, 0)).toBe('10 phút');
      expect(formatFSRSDuePreview(at(3 * 60 * 60_000), now, 0)).toBe('3 giờ');
      expect(formatFSRSDuePreview(at(30 * 60 * 60_000), now, 0)).toBe('1 ngày');
    });
  });

  describe('toFSRSCard', () => {
    it('returns an empty card for new cards', () => {
      const card = toFSRSCard({ status: 'new', due_date: now.toISOString() });
      expect(card.state).toBe(State.New);
      expect(card.reps).toBe(0);
      expect(card.due.toISOString()).toBe(now.toISOString());
    });

    it('treats cards without history as new and falls back to epoch', () => {
      const card = toFSRSCard({ status: 'learning', repetition: 0 });
      expect(card.state).toBe(State.New);
      expect(card.due.getTime()).toBe(0);
    });

    it('uses the supplied date for new cards without due date', () => {
      const card = toFSRSCard({}, now);
      expect(card.due.toISOString()).toBe(now.toISOString());
    });

    it('keeps stored FSRS parameters', () => {
      const lastReviewed = new Date(now.getTime() - 3 * DAY).toISOString();
      const card = toFSRSCard(
        {
          status: 'reviewing',
          repetition: 5,
          interval: 10,
          ease_factor: 2.5,
          due_date: now.toISOString(),
          last_reviewed: lastReviewed,
          stability: 12,
          difficulty: 4,
          lapses: 2,
          state: State.Relearning,
        },
        now
      );

      expect(card).toMatchObject({
        stability: 12,
        difficulty: 4,
        elapsed_days: 3,
        scheduled_days: 10,
        reps: 5,
        lapses: 2,
        state: State.Relearning,
        learning_steps: 0,
      });
      expect(card.last_review?.toISOString()).toBe(lastReviewed);
    });

    it('derives parameters for legacy SM-2 cards', () => {
      const card = toFSRSCard({
        status: 'mastered',
        repetition: 4,
        interval: 20,
        ease_factor: 2.5,
        due_date: now.toISOString(),
        last_reviewed: now.toISOString(),
      });

      expect(card).toMatchObject({
        stability: 20,
        difficulty: 6,
        elapsed_days: 0,
        lapses: 0,
        state: State.Review,
      });
    });

    it('derives defaults when legacy values are missing', () => {
      const card = toFSRSCard({ repetition: 1, stability: 0, difficulty: 0, last_reviewed: '' }, now);
      expect(card).toMatchObject({ stability: 1, difficulty: 6, state: State.Learning, scheduled_days: 0 });
      expect(card.last_review).toBeUndefined();
      expect(card.due.toISOString()).toBe(now.toISOString());
    });

    it('marks long-interval legacy cards as review and clamps difficulty', () => {
      const card = toFSRSCard({ repetition: 3, interval: 14, ease_factor: 1 }, now);
      expect(card.state).toBe(State.Review);
      expect(card.difficulty).toBe(9);

      const easy = toFSRSCard({ repetition: 3, interval: 2, ease_factor: 6 }, now);
      expect(easy.difficulty).toBe(1);
      expect(easy.state).toBe(State.Learning);
    });

    it('falls back to due date as reference when no date is supplied', () => {
      const card = toFSRSCard({
        repetition: 2,
        interval: 3,
        due_date: now.toISOString(),
        last_reviewed: new Date(now.getTime() - 2 * DAY).toISOString(),
      });
      expect(card.elapsed_days).toBe(2);
    });
  });

  describe('calculateFSRS', () => {
    it('calculates results for a new card', () => {
      const result = calculateFSRS({ status: 'new' }, 3, now);

      expect(result.status).toBe('learning');
      expect(result.repetition).toBe(1);
      expect(result.interval).toBe(0);
      expect(Date.parse(result.due_date)).toBeGreaterThan(now.getTime());
    });

    it('schedules easy new cards for review', () => {
      const result = calculateFSRS({ status: 'new' }, 4, now);

      expect(result.status).toBe('reviewing');
      expect(result.state).toBe(State.Review);
      expect(result.interval).toBeGreaterThan(0);
      expect(result.ease_factor).toBeGreaterThanOrEqual(1.3);
      expect(result.ease_factor).toBeLessThanOrEqual(3);
      expect(result.retrievability).toBeGreaterThan(0);
    });

    it('marks mature review cards as mastered', () => {
      const result = calculateFSRS(
        {
          status: 'reviewing',
          repetition: 6,
          interval: 30,
          due_date: now.toISOString(),
          last_reviewed: new Date(now.getTime() - 30 * DAY).toISOString(),
          stability: 30,
          difficulty: 5,
          state: State.Review,
        },
        3,
        now,
        0.5
      );

      expect(result.status).toBe('mastered');
      expect(result.repetition).toBe(7);
    });

    it('counts lapses when a review card is forgotten', () => {
      const result = calculateFSRS(
        {
          status: 'reviewing',
          repetition: 3,
          interval: 10,
          due_date: now.toISOString(),
          last_reviewed: new Date(now.getTime() - 10 * DAY).toISOString(),
          stability: 10,
          difficulty: 5,
          state: State.Review,
        },
        1,
        now,
        0.99
      );

      expect(result.status).toBe('learning');
      expect(result.lapses).toBe(1);
      expect(result.state).toBe(State.Relearning);
    });
  });

  describe('getCardRetrievability', () => {
    it('returns 0 for new or unreviewed cards', () => {
      expect(getCardRetrievability({ status: 'new' }, now)).toBe(0);
      expect(getCardRetrievability({ status: 'learning' }, now)).toBe(0);
    });

    it('returns a percentage for reviewed cards', () => {
      const card = {
        status: 'reviewing' as const,
        repetition: 3,
        interval: 10,
        due_date: now.toISOString(),
        last_reviewed: new Date(now.getTime() - 10 * DAY).toISOString(),
        stability: 10,
        difficulty: 5,
        state: State.Review,
      };

      const value = getCardRetrievability(card, now);
      expect(value).toBeGreaterThan(0);
      expect(value).toBeLessThanOrEqual(100);
      expect(getCardRetrievability(card)).toBeGreaterThan(0);
      expect(getCardRetrievability({ ...card, due_date: undefined }, undefined, 0.5)).toBeGreaterThanOrEqual(0);
    });

    it('returns 90 when retrievability cannot be computed', () => {
      expect(
        getCardRetrievability({ status: 'reviewing', stability: 5, last_reviewed: 'invalid' }, new Date(NaN))
      ).toBe(90);

      const brokenCard = {
        status: 'reviewing' as const,
        stability: 5,
        get due_date(): string {
          throw new Error('broken card');
        },
      };
      expect(getCardRetrievability(brokenCard)).toBe(90);
    });
  });

  describe('getIntervalPreviews', () => {
    it('returns default previews when there is no card', () => {
      expect(getIntervalPreviews(null)).toEqual({
        1: '< 1 phút',
        2: '6 phút',
        3: '10 phút',
        4: '8 ngày',
      });
    });

    it('computes previews for a new card', () => {
      const previews = getIntervalPreviews({ status: 'new' }, 0.9, now);

      expect(previews[1]).toBe('< 1 phút');
      expect(previews[3]).toBe('10 phút');
      expect(previews[4]).toMatch(/ngày$/);
    });

    it('computes previews for a review card using its due date', () => {
      const previews = getIntervalPreviews(
        {
          status: 'reviewing',
          repetition: 5,
          interval: 20,
          due_date: now.toISOString(),
          last_reviewed: new Date(now.getTime() - 20 * DAY).toISOString(),
          stability: 20,
          difficulty: 5,
          state: State.Review,
        },
        1
      );

      expect(previews[4]).toMatch(/(ngày|tháng|năm)$/);
    });

    it('keeps defaults and warns when scheduling fails', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const brokenCard = {
        get due_date(): string {
          throw new Error('broken card');
        },
      };
      const previews = getIntervalPreviews(brokenCard);

      expect(previews[2]).toBe('6 phút');
      expect(warn).toHaveBeenCalled();
    });

    it('falls back to epoch when no date is available', () => {
      const previews = getIntervalPreviews({ status: 'new' });
      expect(previews[1]).toBe('< 1 phút');
    });
  });

  describe('calculateSM2', () => {
    it('resets the card on "again"', () => {
      const result = calculateSM2({ repetition: 3, interval: 10, ease_factor: 1.4 }, 1, now);
      expect(result).toMatchObject({ repetition: 0, interval: 1, ease_factor: 1.3, status: 'learning' });
      expect(result.due_date).toBe('2026-01-02T00:00:00.000Z');
    });

    it('handles "hard" ratings', () => {
      expect(calculateSM2({ repetition: 0, interval: 0, ease_factor: 2.5 }, 2, now)).toMatchObject({
        repetition: 1,
        interval: 1,
        ease_factor: 2.35,
      });
      expect(calculateSM2({ repetition: 2, interval: 10, ease_factor: 0 }, 2, now)).toMatchObject({
        repetition: 3,
        interval: 12,
        ease_factor: 2.35,
      });
    });

    it('handles "good" ratings', () => {
      expect(calculateSM2({ repetition: 0, interval: 0, ease_factor: 2.5 }, 3, now)).toMatchObject({
        repetition: 1,
        interval: 1,
      });
      const result = calculateSM2({ repetition: 1, interval: 1, ease_factor: 2.5 }, 3, now);
      expect(result).toMatchObject({ repetition: 2, interval: 6, ease_factor: 2.5 });
      expect(result.due_date).toBe('2026-01-07T00:00:00.000Z');
      expect(calculateSM2({ repetition: 4, interval: 10, ease_factor: 2.5 }, 3, now)).toMatchObject({
        repetition: 5,
        interval: 25,
        status: 'mastered',
      });
    });

    it('handles "easy" ratings', () => {
      expect(calculateSM2({ repetition: 0, interval: 0, ease_factor: 2.5 }, 4, now)).toMatchObject({
        repetition: 1,
        interval: 3,
        ease_factor: 2.65,
      });
      expect(calculateSM2({ repetition: 1, interval: 3, ease_factor: 2.9 }, 4, now)).toMatchObject({
        repetition: 2,
        interval: 8,
        ease_factor: 3,
      });
      expect(calculateSM2({ repetition: 2, interval: 8, ease_factor: 2.5 }, 4, now)).toMatchObject({
        repetition: 3,
        interval: 26,
        status: 'learning',
      });
    });

    it('uses the current time by default', () => {
      vi.useFakeTimers();
      vi.setSystemTime(now);
      try {
        expect(calculateSM2({ repetition: 0, interval: 0, ease_factor: 2.5 }, 3).due_date).toBe(
          '2026-01-02T00:00:00.000Z'
        );
        expect(calculateFSRS({ status: 'new' }, 3).repetition).toBe(1);
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
