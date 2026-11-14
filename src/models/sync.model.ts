import { CardStatus } from './card.model';

export interface LocalReviewQueueItem {
  id?: number;
  card_id: number;
  card_key: string;
  rating: number; // 1: Again, 2: Hard, 3: Good, 4: Easy
  reviewed_at: string;
  repetition: number;
  interval: number;
  ease_factor: number;
  due_date: string;
  status: CardStatus;
  stability?: number;
  difficulty?: number;
  lapses?: number;
  state?: number;
}

export interface LocalCardProgress {
  card_key: string; // "爱|ài"
  card_id: number;
  repetition: number;
  interval: number;
  ease_factor: number;
  due_date: string;
  last_reviewed: string | null;
  status: CardStatus;
  stability?: number;
  difficulty?: number;
  lapses?: number;
  state?: number;
  updated_at: string;
}

export interface GuestImportPayload {
  cards: Array<{
    card_key: string;
    repetition: number;
    interval: number;
    ease_factor: number;
    due_date: string;
    last_reviewed: string | null;
    status: CardStatus;
    stability?: number;
    difficulty?: number;
    lapses?: number;
    state?: number;
  }>;
  review_logs: Array<{
    card_key: string;
    rating: number;
    reviewed_at: string;
    interval: number;
    ease_factor: number;
  }>;
  life_questions: Array<{ id: number; last_practiced: string | null }>;
  settings: Record<string, unknown> | null;
}

export interface LocalSettings {
  key: string;
  value: Record<string, unknown>;
  updated_at: string;
}

