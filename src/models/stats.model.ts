import { CardStatus, CategoryInfo, ReviewRating } from './card.model';
import { UserSettings } from './user.model';

export interface StudyStats {
  total_cards: number;
  new_cards: number;
  learning_cards: number;
  reviewing_cards: number;
  mastered_cards: number;
  due_today: number;
  retention_rate: number;
  streak_days: number;
  total_reviews: number;
  today_reviewed_count: number;
  categories: CategoryInfo[];
}

export const BACKUP_FORMAT = 'chinese-flashcard-backup' as const;
export const BACKUP_VERSION = 1;

export interface BackupCardProgress {
  key: string;
  hanzi: string;
  pinyin: string;
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
}

export interface BackupReviewLog {
  card_key: string;
  rating: ReviewRating;
  reviewed_at: string;
  interval: number;
  ease_factor: number;
  stability?: number;
  difficulty?: number;
}

export interface BackupLifeProgress {
  id: number;
  completed: boolean;
  last_practiced: string | null;
}

export interface ProgressBackup {
  format: typeof BACKUP_FORMAT;
  version: number;
  exported_at: string;
  settings: UserSettings;
  cards: BackupCardProgress[];
  review_logs: BackupReviewLog[];
  life_questions: BackupLifeProgress[];
}

export interface ImportResult {
  cards: number;
  review_logs: number;
  life_questions: number;
  skipped_cards: number;
}

