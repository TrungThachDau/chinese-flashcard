import Dexie, { type EntityTable } from 'dexie';

export function makeCardKey(card: { hanzi: string; pinyin: string }): string {
  return `${card.hanzi}|${card.pinyin}`;
}

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
  status: 'new' | 'learning' | 'reviewing' | 'mastered';
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
  status: 'new' | 'learning' | 'reviewing' | 'mastered';
  stability?: number;
  difficulty?: number;
  updated_at: string;
}

export interface LocalSettings {
  key: string;
  value: Record<string, unknown>;
  updated_at: string;
}

export class ChineseFlashcardDB extends Dexie {
  card_progress!: EntityTable<LocalCardProgress, 'card_key'>;
  sync_queue!: EntityTable<LocalReviewQueueItem, 'id'>;
  settings!: EntityTable<LocalSettings, 'key'>;

  constructor() {
    super('ChineseFlashcardDB');
    this.version(1).stores({
      card_progress: 'card_key, card_id, status, due_date',
      sync_queue: '++id, card_key, reviewed_at',
      settings: 'key',
    });
  }
}

// Singleton instance safe for Next.js SSR / client-only execution
let dbInstance: ChineseFlashcardDB | null = null;

export function getLocalDb(): ChineseFlashcardDB | null {
  if (typeof window === 'undefined') {
    return null;
  }
  if (!dbInstance) {
    dbInstance = new ChineseFlashcardDB();
  }
  return dbInstance;
}

const ACTIVE_USER_ID_KEY = 'hsk_active_user_id';

/**
 * Clear IndexedDB & localStorage if the logged-in user changed, preventing data leak across accounts.
 */
export async function clearLocalDbForUserSwitch(newUserId: string): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const prevUserId = localStorage.getItem(ACTIVE_USER_ID_KEY);
    if (prevUserId && prevUserId !== newUserId) {
      await clearAllLocalData();
    }
    localStorage.setItem(ACTIVE_USER_ID_KEY, newUserId);
  } catch (err) {
    console.warn('Error checking user switch in localDb:', err);
  }
}

/**
 * Clear all cached user progress and settings from IndexedDB and localStorage on logout.
 */
export async function clearAllLocalData(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('chinese_flashcard_settings');
    localStorage.removeItem('hsk_has_onboarded');
    localStorage.removeItem(ACTIVE_USER_ID_KEY);
    const db = getLocalDb();
    if (db) {
      await Promise.all([
        db.card_progress.clear(),
        db.sync_queue.clear(),
        db.settings.clear(),
      ]);
    }
  } catch (err) {
    console.warn('Error clearing local DB:', err);
  }
}
