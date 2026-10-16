import {
  fsrs,
  createEmptyCard,
  State,
  type Card as FSRSCard,
  type Grade,
} from 'ts-fsrs';
import { Card, CardStatus, ReviewRating } from '@/models';

export interface SrsCalculationResult {
  repetition: number;
  interval: number; // in days
  ease_factor: number;
  due_date: string;
  status: CardStatus;
  stability?: number;
  difficulty?: number;
  retrievability?: number;
  lapses?: number;
  state?: number;
}

export type FSRSCalculationResult = SrsCalculationResult;

/**
 * Converts a database Card into a ts-fsrs Card structure.
 * Supports legacy SM-2 cards seamlessly by deriving initial Difficulty (D) and Stability (S).
 */
export function toFSRSCard(card: Partial<Card>, now?: Date): FSRSCard {
  const refDate = now ?? (card.due_date ? new Date(card.due_date) : new Date(0));
  const isNew =
    card.status === 'new' ||
    ((card.repetition ?? 0) === 0 && !card.last_reviewed && !card.stability);

  if (isNew) {
    const empty = createEmptyCard(card.due_date ? new Date(card.due_date) : refDate);
    return empty;
  }

  const stability =
    card.stability !== undefined && card.stability > 0
      ? card.stability
      : Math.max(0.5, card.interval || 1);

  const difficulty =
    card.difficulty !== undefined && card.difficulty > 0
      ? card.difficulty
      : Math.min(10, Math.max(1, 11 - 2 * (card.ease_factor || 2.5)));

  const lastReviewDate = card.last_reviewed ? new Date(card.last_reviewed) : undefined;
  const elapsedDays = lastReviewDate
    ? Math.max(0, Math.floor((refDate.getTime() - lastReviewDate.getTime()) / (24 * 60 * 60 * 1000)))
    : 0;

  const state =
    card.state !== undefined
      ? (card.state as State)
      : card.status === 'mastered' || (card.interval ?? 0) >= 14
      ? State.Review
      : State.Learning;

  return {
    due: card.due_date ? new Date(card.due_date) : refDate,
    stability,
    difficulty,
    elapsed_days: elapsedDays,
    scheduled_days: card.interval ?? 0,
    reps: card.repetition ?? 0,
    lapses: card.lapses ?? 0,
    state,
    last_review: lastReviewDate,
    learning_steps: 0,
  };
}

/**
 * FSRS (Free Spaced Repetition Scheduler) v5 Implementation.
 */
export function calculateFSRS(
  card: Partial<Card>,
  rating: ReviewRating,
  now: Date = new Date(),
  requestRetention: number = 0.9
): FSRSCalculationResult {
  const targetRetention = Math.min(0.97, Math.max(0.75, requestRetention));
  const scheduler = fsrs({
    request_retention: targetRetention,
    enable_fuzz: false,
    enable_short_term: true,
  });

  const fsrsCard = toFSRSCard(card, now);
  const grade = rating as Grade;
  const result = scheduler.next(fsrsCard, now, grade);
  const updatedCard = result.card;

  const dueTime = updatedCard.due.getTime();
  const nowTime = now.getTime();
  const diffDays = Math.max(0, (dueTime - nowTime) / (24 * 60 * 60 * 1000));
  const intervalDays =
    updatedCard.scheduled_days > 0
      ? updatedCard.scheduled_days
      : Math.max(0, Math.round(diffDays));

  let status: CardStatus = 'learning';
  if (
    updatedCard.state === State.Review &&
    (updatedCard.stability >= 21 || updatedCard.reps >= 4)
  ) {
    status = 'mastered';
  } else if (updatedCard.state === State.Review) {
    status = 'reviewing';
  } else {
    status = 'learning';
  }

  const retrievabilityStr = scheduler.get_retrievability(updatedCard, updatedCard.due);
  const retrievability =
    typeof retrievabilityStr === 'number'
      ? retrievabilityStr
      : parseFloat(String(retrievabilityStr).replace('%', '')) || targetRetention * 100;

  const easeFactor = Number(
    Math.max(1.3, Math.min(3.0, (11 - updatedCard.difficulty) / 2)).toFixed(2)
  );

  return {
    repetition: updatedCard.reps,
    interval: intervalDays,
    ease_factor: easeFactor,
    due_date: updatedCard.due.toISOString(),
    status,
    stability: Number(updatedCard.stability.toFixed(2)),
    difficulty: Number(updatedCard.difficulty.toFixed(2)),
    retrievability: Number(retrievability.toFixed(1)),
    lapses: updatedCard.lapses,
    state: updatedCard.state,
  };
}

/**
 * Calculates current Retrievability % (Khả năng nhớ lại lúc này: 0% - 100%)
 */
export function getCardRetrievability(
  card: Partial<Card>,
  now?: Date,
  requestRetention: number = 0.9
): number {
  if (card.status === 'new' || (!card.last_reviewed && !card.stability)) {
    return 0;
  }

  try {
    const refDate = now ?? (card.due_date ? new Date(card.due_date) : new Date(0));
    const scheduler = fsrs({
      request_retention: Math.min(0.97, Math.max(0.75, requestRetention)),
    });
    const fsrsCard = toFSRSCard(card, refDate);
    const r = scheduler.get_retrievability(fsrsCard, refDate);
    const num = parseFloat(String(r).replace('%', ''));
    return Number.isNaN(num) ? 90 : Math.max(0, Math.min(100, num));
  } catch {
    return 90;
  }
}

/**
 * Formats FSRS due preview nicely in Vietnamese (e.g. "< 1 phút", "10 phút", "1 ngày", "2 tháng")
 */
export function formatFSRSDuePreview(due: Date, now: Date, scheduledDays: number): string {
  if (scheduledDays > 0) {
    if (scheduledDays === 1) return '1 ngày';
    if (scheduledDays < 30) return `${scheduledDays} ngày`;
    const months = Math.round(scheduledDays / 30);
    if (months < 12) return `${months} tháng`;
    const years = (scheduledDays / 365).toFixed(1);
    return `${years} năm`;
  }

  const diffMinutes = Math.max(0, Math.round((due.getTime() - now.getTime()) / 60000));
  if (diffMinutes <= 1) return '< 1 phút';
  if (diffMinutes < 60) return `${diffMinutes} phút`;
  const hours = Math.round(diffMinutes / 60);
  if (hours < 24) return `${hours} giờ`;
  return '1 ngày';
}

export function formatIntervalPreview(days: number): string {
  if (days <= 0) return 'Hôm nay';
  if (days === 1) return '1 ngày';
  if (days < 30) return `${days} ngày`;
  const months = Math.round(days / 30);
  return `${months} tháng`;
}

/**
 * Returns human-readable label for next review intervals for all 4 ratings (FSRS)
 */
export function getIntervalPreviews(
  card: Partial<Card> | null,
  requestRetention: number = 0.9,
  now?: Date
): Record<ReviewRating, string> {
  const previews: Record<ReviewRating, string> = {
    1: '< 1 phút',
    2: '6 phút',
    3: '10 phút',
    4: '8 ngày',
  };

  if (!card) return previews;

  try {
    const refDate = now ?? (card.due_date ? new Date(card.due_date) : new Date(0));
    const scheduler = fsrs({
      request_retention: Math.min(0.97, Math.max(0.75, requestRetention)),
      enable_fuzz: false,
      enable_short_term: true,
    });
    const fsrsCard = toFSRSCard(card, refDate);
    const repeatResult = scheduler.repeat(fsrsCard, refDate);

    const ratings: ReviewRating[] = [1, 2, 3, 4];
    for (const r of ratings) {
      const scheduledItem = repeatResult[r as Grade];
      if (scheduledItem) {
        previews[r] = formatFSRSDuePreview(
          scheduledItem.card.due,
          refDate,
          scheduledItem.card.scheduled_days
        );
      }
    }
  } catch (err) {
    console.warn('Failed to compute FSRS previews:', err);
  }

  return previews;
}

/**
 * Legacy SM-2 Spaced Repetition Algorithm (preserved for fallback or compatibility)
 */
export function calculateSM2(
  card: Pick<Card, 'repetition' | 'interval' | 'ease_factor'>,
  rating: ReviewRating,
  now: Date = new Date()
): SrsCalculationResult {
  let repetition = card.repetition;
  let interval = card.interval;
  let ease_factor = card.ease_factor || 2.5;

  if (rating === 1) {
    repetition = 0;
    interval = 1;
    ease_factor = Math.max(1.3, ease_factor - 0.2);
  } else if (rating === 2) {
    repetition += 1;
    if (interval === 0) {
      interval = 1;
    } else {
      interval = Math.max(1, Math.round(interval * 1.2));
    }
    ease_factor = Math.max(1.3, ease_factor - 0.15);
  } else if (rating === 3) {
    if (repetition === 0) {
      interval = 1;
    } else if (repetition === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * ease_factor);
    }
    repetition += 1;
    ease_factor = ease_factor + (0.1 - (5 - 4) * (0.08 + (5 - 4) * 0.02));
  } else if (rating === 4) {
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

  interval = Math.max(1, interval);
  ease_factor = Number(ease_factor.toFixed(2));

  const dueDate = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);

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

