export type CardStatus = 'new' | 'learning' | 'reviewing' | 'mastered';

export type ReviewRating = 1 | 2 | 3 | 4; // 1: Again, 2: Hard, 3: Good, 4: Easy

export interface Word {
  id: string;
  hanzi: string;
  pinyin: string;
  meaning: string;
  sino_vietnamese?: string;
  category: string;
  category_name: string;
  example_sentence?: string;
  example_pinyin?: string;
  example_meaning?: string;
}

export type RawCardData = Word;

export interface Card {
  id: number;
  hanzi: string;
  pinyin: string;
  meaning: string;
  sino_vietnamese?: string;
  category: string;
  category_name: string;
  example_sentence?: string;
  example_pinyin?: string;
  example_meaning?: string;
  repetition: number;
  interval: number; // in days
  ease_factor: number;
  due_date: string; // ISO date string
  last_reviewed: string | null;
  status: CardStatus;
  // FSRS parameters
  stability?: number;
  difficulty?: number;
  retrievability?: number;
  lapses?: number;
  state?: number;
}

export interface ReviewLog {
  id: number;
  card_id: number;
  rating: ReviewRating;
  reviewed_at: string;
  interval: number;
  ease_factor: number;
  stability?: number;
  difficulty?: number;
}

export interface CategoryInfo {
  id: string;
  name: string;
  icon: string;
  color: string;
  total: number;
  new_count: number;
  learning_count: number;
  reviewing_count: number;
  mastered_count: number;
}

export interface CardFilterOptions {
  category?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
  mode?: string;
  dueOnly?: boolean;
  allowNew?: boolean;
}

export function makeCardKey(card: { hanzi: string; pinyin: string }): string {
  return `${card.hanzi}|${card.pinyin}`;
}

