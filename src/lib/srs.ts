import { Card, CardStatus, ReviewRating } from './types';

export interface SrsCalculationResult {
  repetition: number;
  interval: number; // in days
  ease_factor: number;
  due_date: string;
  status: CardStatus;
}

/**
 * SM-2 Spaced Repetition Algorithm implementation
 * Ratings:
 * 1: Again (Quên) - Reset streak, review soon
 * 2: Hard (Khó) - Recalled with significant difficulty
 * 3: Good (Tốt) - Recalled with standard effort
 * 4: Easy (Dễ) - Perfect recall, increase interval bonus
 */
export function calculateSM2(
  card: Pick<Card, 'repetition' | 'interval' | 'ease_factor'>,
  rating: ReviewRating,
  now: Date = new Date()
): SrsCalculationResult {
  let repetition = card.repetition;
  let interval = card.interval;
  let ease_factor = card.ease_factor || 2.5;

  // Grade mapping to SuperMemo 0-5 scale:
  // 1 (Again) -> grade 1
  // 2 (Hard) -> grade 3
  // 3 (Good) -> grade 4
  // 4 (Easy) -> grade 5

  if (rating === 1) {
    // Again / Failure
    repetition = 0;
    interval = 1;
    ease_factor = Math.max(1.3, ease_factor - 0.2);
  } else if (rating === 2) {
    // Hard
    repetition += 1;
    if (interval === 0) {
      interval = 1;
    } else {
      interval = Math.max(1, Math.round(interval * 1.2));
    }
    ease_factor = Math.max(1.3, ease_factor - 0.15);
  } else if (rating === 3) {
    // Good
    if (repetition === 0) {
      interval = 1;
    } else if (repetition === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * ease_factor);
    }
    repetition += 1;
    // Standard SM-2 ease factor formula adjustment
    ease_factor = ease_factor + (0.1 - (5 - 4) * (0.08 + (5 - 4) * 0.02));
  } else if (rating === 4) {
    // Easy
    if (repetition === 0) {
      interval = 3;
    } else if (repetition === 1) {
      interval = 8;
    } else {
      interval = Math.round(interval * ease_factor * 1.3);
    }
    repetition += 1;
    ease_factor = Math.min(3.0, ease_factor + 0.15);
  }

  // Ensure minimum interval is 1 day
  interval = Math.max(1, interval);
  ease_factor = Number(ease_factor.toFixed(2));

  // Calculate new due date
  const dueDate = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);

  // Determine status
  let status: CardStatus = 'learning';
  if (repetition >= 4 && interval >= 14) {
    status = 'mastered';
  } else if (repetition === 0) {
    status = 'learning';
  }

  return {
    repetition,
    interval,
    ease_factor,
    due_date: dueDate.toISOString(),
    status,
  };
}

/**
 * Returns human-readable label for the next due interval for each rating
 */
export function formatIntervalPreview(days: number): string {
  if (days <= 0) return 'Hôm nay';
  if (days === 1) return '1 ngày';
  if (days < 30) return `${days} ngày`;
  const months = Math.round(days / 30);
  return `${months} tháng`;
}

export function getIntervalPreviews(card: Pick<Card, 'repetition' | 'interval' | 'ease_factor'>): Record<ReviewRating, string> {
  const ratings: ReviewRating[] = [1, 2, 3, 4];
  const previews: Record<ReviewRating, string> = {
    1: '',
    2: '',
    3: '',
    4: '',
  };

  for (const r of ratings) {
    const result = calculateSM2(card, r);
    previews[r] = formatIntervalPreview(result.interval);
  }

  return previews;
}

