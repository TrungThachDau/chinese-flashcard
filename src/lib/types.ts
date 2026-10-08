export type CardStatus = 'new' | 'learning' | 'reviewing' | 'mastered';

export interface Card {
  id: number;
  hanzi: string;
  pinyin: string;
  meaning: string;
  sino_vietnamese: string;
  category: string;
  category_name: string;
  example_sentence: string;
  example_pinyin: string;
  example_meaning: string;
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

export type ReviewRating = 1 | 2 | 3 | 4; // 1: Again, 2: Hard, 3: Good, 4: Easy

export interface CharDetail {
  char: string;
  pinyin: string;
  sino_vietnamese: string;
  radical: string;
  radical_meaning: string;
  stroke_count: number;
  decomposition: string;
  explanation: string;
}

export interface LifeQuestion {
  id: number;
  topic: string;
  topic_name: string;
  situation: string;
  question_hanzi: string;
  question_pinyin: string;
  question_meaning: string;
  answer_hanzi: string;
  answer_pinyin: string;
  answer_meaning: string;
  options: string[]; // Options for interactive quiz
  explanation: string;
  completed: boolean;
  last_practiced: string | null;
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

export interface UserSettings {
  user_name: string;
  daily_limit: number;
  speech_rate: number;
  audio_engine: 'online' | 'browser';
  auto_play_audio: boolean;
  has_onboarded: boolean;
  hsk_level: number;
  fsrs_retention?: number;
}

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

