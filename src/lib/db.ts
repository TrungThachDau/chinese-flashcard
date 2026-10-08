import path from 'path';
import fs from 'fs';
import os from 'os';
import {
  Card,
  CardStatus,
  CharDetail,
  LifeQuestion,
  ReviewRating,
  ReviewLog,
  StudyStats,
  CategoryInfo,
  UserSettings,
} from './types';
import { INITIAL_CHAR_DETAILS, INITIAL_LIFE_QUESTIONS, CATEGORIES_CONFIG } from './initialData';
import { HSK30_LEVEL1_CARDS, HSK30_CHAR_DETAILS } from './hsk30Data';
import { calculateSM2 } from './srs';

import { createRequire } from 'node:module';

// Safely load node:sqlite without crashing on runtimes where it is absent
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let DatabaseSyncClass: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const proc = process as any;
  if (typeof proc.getBuiltinModule === 'function') {
    const sqlite = proc.getBuiltinModule('node:sqlite');
    DatabaseSyncClass = sqlite?.DatabaseSync || null;
  }
} catch {
  DatabaseSyncClass = null;
}

if (!DatabaseSyncClass) {
  try {
    const nodeRequire = createRequire(process.cwd() + '/package.json');
    const sqlite = nodeRequire('node:sqlite');
    DatabaseSyncClass = sqlite.DatabaseSync || null;
  } catch {
    DatabaseSyncClass = null;
  }
}

// Global declaration for hot-reloading and lambda instance caching
declare global {
  // eslint-disable-next-line no-var
  var __sqliteDbInstance: any;
  // eslint-disable-next-line no-var
  var __inMemoryStoreInstance: MemoryStore | undefined;
}

// ---------------------------------------------------------------------------
// 1. IN-MEMORY STORE (Fallback for Vercel Serverless / Read-Only Environments)
// ---------------------------------------------------------------------------
interface MemoryStore {
  cards: Card[];
  charDetails: Map<string, CharDetail>;
  lifeQuestions: LifeQuestion[];
  reviewLogs: ReviewLog[];
  userSettings: UserSettings;
}

function initMemoryStore(): MemoryStore {
  const now = new Date().toISOString();

  const cards: Card[] = HSK30_LEVEL1_CARDS.map((card, idx) => ({
    ...card,
    id: idx + 1,
    repetition: 0,
    interval: 0,
    ease_factor: 2.5,
    due_date: now,
    last_reviewed: null,
    status: 'new' as CardStatus,
  }));

  const charDetails = new Map<string, CharDetail>();
  for (const detail of HSK30_CHAR_DETAILS) {
    charDetails.set(detail.char, detail);
  }
  for (const detail of Object.values(INITIAL_CHAR_DETAILS)) {
    charDetails.set(detail.char, detail);
  }

  const lifeQuestions: LifeQuestion[] = INITIAL_LIFE_QUESTIONS.map((q) => ({
    ...q,
    options: [...q.options],
    completed: Boolean(q.completed),
    last_practiced: q.last_practiced || null,
  }));

  const userSettings: UserSettings = {
    user_name: 'Học viên',
    daily_limit: 15,
    speech_rate: 0.85,
    audio_engine: 'online',
    auto_play_audio: false,
    has_onboarded: false,
    hsk_level: 1,
  };

  return {
    cards,
    charDetails,
    lifeQuestions,
    reviewLogs: [],
    userSettings,
  };
}

function getMemoryStore(): MemoryStore {
  if (!globalThis.__inMemoryStoreInstance) {
    globalThis.__inMemoryStoreInstance = initMemoryStore();
  }
  return globalThis.__inMemoryStoreInstance;
}

// ---------------------------------------------------------------------------
// 2. SQLITE DATABASE SETUP & DETECTION
// ---------------------------------------------------------------------------
function getSafeDbPath(): string | null {
  const isServerless = Boolean(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.LAMBDA_TASK_ROOT
  );

  const candidateDirs = isServerless
    ? [path.join(os.tmpdir(), 'chinese-flashcard-data'), os.tmpdir()]
    : [path.join(process.cwd(), 'data'), path.join(os.tmpdir(), 'chinese-flashcard-data'), os.tmpdir()];

  for (const dir of candidateDirs) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      // Verify write permissions
      const testFile = path.join(dir, `.test_write_${Date.now()}`);
      fs.writeFileSync(testFile, '1');
      fs.unlinkSync(testFile);
      return path.join(dir, 'flashcard.db');
    } catch {
      continue;
    }
  }

  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getDatabase(): any | null {
  if (globalThis.__sqliteDbInstance) {
    return globalThis.__sqliteDbInstance;
  }

  if (!DatabaseSyncClass) {
    return null;
  }

  const dbPath = getSafeDbPath();
  if (!dbPath) {
    return null;
  }

  try {
    const db = new DatabaseSyncClass(dbPath);
    initDatabase(db);
    globalThis.__sqliteDbInstance = db;
    return db;
  } catch (error) {
    console.warn('Could not initialize SQLite database, using in-memory store:', error);
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function initDatabase(db: any) {
  // 1. Cards Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hanzi TEXT NOT NULL,
      pinyin TEXT NOT NULL,
      meaning TEXT NOT NULL,
      sino_vietnamese TEXT NOT NULL,
      category TEXT NOT NULL,
      category_name TEXT NOT NULL,
      example_sentence TEXT,
      example_pinyin TEXT,
      example_meaning TEXT,
      repetition INTEGER DEFAULT 0,
      interval INTEGER DEFAULT 0,
      ease_factor REAL DEFAULT 2.5,
      due_date TEXT NOT NULL,
      last_reviewed TEXT,
      status TEXT DEFAULT 'new'
    );
  `);

  // 2. Character Details Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS char_details (
      char TEXT PRIMARY KEY,
      pinyin TEXT,
      sino_vietnamese TEXT,
      radical TEXT,
      radical_meaning TEXT,
      stroke_count INTEGER,
      decomposition TEXT,
      explanation TEXT
    );
  `);

  // 3. Life Questions Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS life_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic TEXT NOT NULL,
      topic_name TEXT NOT NULL,
      situation TEXT,
      question_hanzi TEXT NOT NULL,
      question_pinyin TEXT NOT NULL,
      question_meaning TEXT NOT NULL,
      answer_hanzi TEXT NOT NULL,
      answer_pinyin TEXT NOT NULL,
      answer_meaning TEXT NOT NULL,
      options_json TEXT NOT NULL,
      explanation TEXT,
      completed INTEGER DEFAULT 0,
      last_practiced TEXT
    );
  `);

  // 4. Review Logs Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS review_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      card_id INTEGER NOT NULL,
      rating INTEGER NOT NULL,
      reviewed_at TEXT NOT NULL,
      interval INTEGER NOT NULL,
      ease_factor REAL NOT NULL
    );
  `);

  // 5. User Settings Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Default settings
  const defaultSettings: Record<string, string> = {
    user_name: 'Học viên',
    daily_limit: '15',
    speech_rate: '0.85',
    audio_engine: 'online',
    auto_play_audio: 'false',
    has_onboarded: 'false',
    hsk_level: '1',
  };

  for (const [k, v] of Object.entries(defaultSettings)) {
    db.prepare('INSERT OR IGNORE INTO user_settings (key, value) VALUES (?, ?)').run(k, v);
  }

  // Check if cards table is empty and seed
  const countRow = db.prepare('SELECT COUNT(*) as count FROM cards').get() as { count: number };
  if (!countRow || countRow.count === 0) {
    seedDatabase(db);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function seedDatabase(db: any = getDatabase()) {
  if (!db) return;
  const now = new Date().toISOString();

  // Insert cards
  const insertCardStmt = db.prepare(`
    INSERT INTO cards (
      hanzi, pinyin, meaning, sino_vietnamese, category, category_name,
      example_sentence, example_pinyin, example_meaning, repetition,
      interval, ease_factor, due_date, last_reviewed, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const card of HSK30_LEVEL1_CARDS) {
    insertCardStmt.run(
      card.hanzi,
      card.pinyin,
      card.meaning,
      card.sino_vietnamese,
      card.category,
      card.category_name,
      card.example_sentence,
      card.example_pinyin,
      card.example_meaning,
      0,
      0,
      2.5,
      now,
      null,
      'new'
    );
  }

  // Insert char details
  const insertCharStmt = db.prepare(`
    INSERT OR REPLACE INTO char_details (
      char, pinyin, sino_vietnamese, radical, radical_meaning,
      stroke_count, decomposition, explanation
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const detail of HSK30_CHAR_DETAILS) {
    insertCharStmt.run(
      detail.char,
      detail.pinyin,
      detail.sino_vietnamese,
      detail.radical,
      detail.radical_meaning,
      detail.stroke_count,
      detail.decomposition,
      detail.explanation
    );
  }

  for (const detail of Object.values(INITIAL_CHAR_DETAILS)) {
    insertCharStmt.run(
      detail.char,
      detail.pinyin,
      detail.sino_vietnamese,
      detail.radical,
      detail.radical_meaning,
      detail.stroke_count,
      detail.decomposition,
      detail.explanation
    );
  }

  // Insert life questions
  const insertQuestionStmt = db.prepare(`
    INSERT OR REPLACE INTO life_questions (
      id, topic, topic_name, situation, question_hanzi, question_pinyin,
      question_meaning, answer_hanzi, answer_pinyin, answer_meaning,
      options_json, explanation, completed, last_practiced
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const q of INITIAL_LIFE_QUESTIONS) {
    insertQuestionStmt.run(
      q.id,
      q.topic,
      q.topic_name,
      q.situation,
      q.question_hanzi,
      q.question_pinyin,
      q.question_meaning,
      q.answer_hanzi,
      q.answer_pinyin,
      q.answer_meaning,
      JSON.stringify(q.options),
      q.explanation,
      q.completed ? 1 : 0,
      q.last_practiced
    );
  }
}

export function toPlain<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

// ---------------------------------------------------------------------------
// 3. PUBLIC DATA ACCESS FUNCTIONS (DUAL SQLITE / IN-MEMORY FALLBACK)
// ---------------------------------------------------------------------------

export function getAllCards(filters?: { category?: string; status?: string; search?: string }): Card[] {
  const db = getDatabase();
  if (db) {
    try {
      let query = 'SELECT * FROM cards WHERE 1=1';
      const params: (string | number | null)[] = [];

      if (filters?.category && filters.category !== 'all') {
        query += ' AND category = ?';
        params.push(filters.category);
      }

      if (filters?.status && filters.status !== 'all') {
        if (filters.status === 'reviewing') {
          const now = new Date().toISOString();
          query += ' AND due_date <= ?';
          params.push(now);
        } else {
          query += ' AND status = ?';
          params.push(filters.status);
        }
      }

      if (filters?.search && filters.search.trim()) {
        const term = `%${filters.search.trim()}%`;
        query += ' AND (hanzi LIKE ? OR pinyin LIKE ? OR meaning LIKE ? OR sino_vietnamese LIKE ?)';
        params.push(term, term, term, term);
      }

      query += ' ORDER BY id ASC';
      const rows = db.prepare(query).all(...params);
      return toPlain(rows as unknown as Card[]);
    } catch (err) {
      console.warn('SQLite getAllCards error, falling back to memory store:', err);
    }
  }

  // In-Memory Fallback
  const store = getMemoryStore();
  const now = new Date().toISOString();
  let result = [...store.cards];

  if (filters?.category && filters.category !== 'all') {
    result = result.filter((c) => c.category === filters.category);
  }

  if (filters?.status && filters.status !== 'all') {
    if (filters.status === 'reviewing') {
      result = result.filter((c) => c.due_date <= now);
    } else {
      result = result.filter((c) => c.status === filters.status);
    }
  }

  if (filters?.search && filters.search.trim()) {
    const term = filters.search.trim().toLowerCase();
    result = result.filter(
      (c) =>
        c.hanzi.toLowerCase().includes(term) ||
        c.pinyin.toLowerCase().includes(term) ||
        c.meaning.toLowerCase().includes(term) ||
        c.sino_vietnamese.toLowerCase().includes(term)
    );
  }

  result.sort((a, b) => a.id - b.id);
  return toPlain(result);
}

export function getCardById(id: number): Card | null {
  const db = getDatabase();
  if (db) {
    try {
      const row = db.prepare('SELECT * FROM cards WHERE id = ?').get(id);
      return row ? toPlain(row as unknown as Card) : null;
    } catch (err) {
      console.warn('SQLite getCardById error, falling back to memory store:', err);
    }
  }

  const store = getMemoryStore();
  const card = store.cards.find((c) => c.id === id);
  return card ? toPlain(card) : null;
}

export function getDueCards(limit?: number): Card[] {
  const settings = getUserSettings();
  const maxLimit = limit ?? settings.daily_limit;
  const now = new Date().toISOString();

  const db = getDatabase();
  if (db) {
    try {
      const rows = db.prepare(`
        SELECT * FROM cards 
        WHERE due_date <= ? OR status = 'new'
        ORDER BY 
          CASE status 
            WHEN 'learning' THEN 1 
            WHEN 'new' THEN 2 
            WHEN 'reviewing' THEN 3 
            ELSE 4 
          END,
          due_date ASC 
        LIMIT ?
      `).all(now, maxLimit);

      return toPlain(rows as unknown as Card[]);
    } catch (err) {
      console.warn('SQLite getDueCards error, falling back to memory store:', err);
    }
  }

  // In-Memory Fallback
  const store = getMemoryStore();
  const due = store.cards.filter((c) => c.due_date <= now || c.status === 'new');

  const statusPriority: Record<string, number> = {
    learning: 1,
    new: 2,
    reviewing: 3,
    mastered: 4,
  };

  due.sort((a, b) => {
    const prioA = statusPriority[a.status] || 5;
    const prioB = statusPriority[b.status] || 5;
    if (prioA !== prioB) return prioA - prioB;
    return a.due_date.localeCompare(b.due_date);
  });

  return toPlain(due.slice(0, maxLimit));
}

export function recordCardReview(cardId: number, rating: ReviewRating): Card | null {
  const currentCard = getCardById(cardId);
  if (!currentCard) return null;

  const now = new Date();
  const srsResult = calculateSM2(currentCard, rating, now);

  const db = getDatabase();
  if (db) {
    try {
      db.prepare(`
        UPDATE cards SET
          repetition = ?,
          interval = ?,
          ease_factor = ?,
          due_date = ?,
          last_reviewed = ?,
          status = ?
        WHERE id = ?
      `).run(
        srsResult.repetition,
        srsResult.interval,
        srsResult.ease_factor,
        srsResult.due_date,
        now.toISOString(),
        srsResult.status,
        cardId
      );

      db.prepare(`
        INSERT INTO review_logs (card_id, rating, reviewed_at, interval, ease_factor)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        cardId,
        rating,
        now.toISOString(),
        srsResult.interval,
        srsResult.ease_factor
      );

      return getCardById(cardId);
    } catch (err) {
      console.warn('SQLite recordCardReview error, falling back to memory store:', err);
    }
  }

  // In-Memory Fallback
  const store = getMemoryStore();
  const cardIndex = store.cards.findIndex((c) => c.id === cardId);
  if (cardIndex === -1) return null;

  const updated: Card = {
    ...store.cards[cardIndex],
    repetition: srsResult.repetition,
    interval: srsResult.interval,
    ease_factor: srsResult.ease_factor,
    due_date: srsResult.due_date,
    last_reviewed: now.toISOString(),
    status: srsResult.status,
  };

  store.cards[cardIndex] = updated;

  store.reviewLogs.push({
    id: store.reviewLogs.length + 1,
    card_id: cardId,
    rating,
    reviewed_at: now.toISOString(),
    interval: srsResult.interval,
    ease_factor: srsResult.ease_factor,
  });

  return toPlain(updated);
}

export function getCharDetail(char: string): CharDetail | null {
  const db = getDatabase();
  if (db) {
    try {
      const row = db.prepare('SELECT * FROM char_details WHERE char = ?').get(char);
      if (row) return toPlain(row as unknown as CharDetail);
    } catch (err) {
      console.warn('SQLite getCharDetail error, falling back to memory store:', err);
    }
  }

  const store = getMemoryStore();
  const found = store.charDetails.get(char);
  if (found) return toPlain(found);

  if (INITIAL_CHAR_DETAILS[char]) {
    return toPlain(INITIAL_CHAR_DETAILS[char]);
  }

  return null;
}

export function getAllCharDetails(): Record<string, CharDetail> {
  const db = getDatabase();
  if (db) {
    try {
      const rows = db.prepare('SELECT * FROM char_details').all() as unknown as CharDetail[];
      const map: Record<string, CharDetail> = { ...INITIAL_CHAR_DETAILS };
      for (const r of rows) {
        map[r.char] = r;
      }
      return toPlain(map);
    } catch (err) {
      console.warn('SQLite getAllCharDetails error, falling back to memory store:', err);
    }
  }

  const store = getMemoryStore();
  const map: Record<string, CharDetail> = { ...INITIAL_CHAR_DETAILS };
  for (const [k, v] of store.charDetails.entries()) {
    map[k] = v;
  }
  return toPlain(map);
}

export function getLifeQuestions(): LifeQuestion[] {
  const db = getDatabase();
  if (db) {
    try {
      const rows = db.prepare('SELECT * FROM life_questions ORDER BY id ASC').all() as unknown as Array<
        Omit<LifeQuestion, 'options' | 'completed'> & { options_json: string; completed: number }
      >;

      const parsed = rows.map((r) => ({
        ...r,
        completed: r.completed === 1,
        options: JSON.parse(r.options_json || '[]'),
      }));
      return toPlain(parsed);
    } catch (err) {
      console.warn('SQLite getLifeQuestions error, falling back to memory store:', err);
    }
  }

  const store = getMemoryStore();
  return toPlain(store.lifeQuestions);
}

export function recordLifeQuestionPractice(questionId: number): boolean {
  const now = new Date().toISOString();

  const db = getDatabase();
  if (db) {
    try {
      db.prepare(`
        UPDATE life_questions 
        SET completed = 1, last_practiced = ? 
        WHERE id = ?
      `).run(now, questionId);
      return true;
    } catch (err) {
      console.warn('SQLite recordLifeQuestionPractice error, falling back to memory store:', err);
    }
  }

  const store = getMemoryStore();
  const q = store.lifeQuestions.find((item) => item.id === questionId);
  if (q) {
    q.completed = true;
    q.last_practiced = now;
    return true;
  }
  return false;
}

export function getUserSettings(): UserSettings {
  const db = getDatabase();
  if (db) {
    try {
      const rows = db.prepare('SELECT key, value FROM user_settings').all() as Array<{ key: string; value: string }>;
      const map: Record<string, string> = {};
      for (const r of rows) {
        map[r.key] = r.value;
      }
      return toPlain({
        user_name: map.user_name || 'Học viên',
        daily_limit: parseInt(map.daily_limit || '15', 10),
        speech_rate: parseFloat(map.speech_rate || '0.85'),
        audio_engine: (map.audio_engine === 'browser' ? 'browser' : 'online') as 'online' | 'browser',
        auto_play_audio: map.auto_play_audio === 'true',
        has_onboarded: map.has_onboarded === 'true',
        hsk_level: parseInt(map.hsk_level || '1', 10),
      });
    } catch (err) {
      console.warn('SQLite getUserSettings error, falling back to memory store:', err);
    }
  }

  const store = getMemoryStore();
  return toPlain(store.userSettings);
}

export function updateUserSettings(settings: Partial<UserSettings>): UserSettings {
  const db = getDatabase();
  if (db) {
    try {
      const updateStmt = db.prepare('INSERT OR REPLACE INTO user_settings (key, value) VALUES (?, ?)');

      if (settings.user_name !== undefined) updateStmt.run('user_name', settings.user_name.trim() || 'Học viên');
      if (settings.daily_limit !== undefined) updateStmt.run('daily_limit', Math.max(5, settings.daily_limit).toString());
      if (settings.speech_rate !== undefined) updateStmt.run('speech_rate', settings.speech_rate.toString());
      if (settings.audio_engine !== undefined) updateStmt.run('audio_engine', settings.audio_engine);
      if (settings.auto_play_audio !== undefined) updateStmt.run('auto_play_audio', settings.auto_play_audio ? 'true' : 'false');
      if (settings.has_onboarded !== undefined) updateStmt.run('has_onboarded', settings.has_onboarded ? 'true' : 'false');
      if (settings.hsk_level !== undefined) updateStmt.run('hsk_level', settings.hsk_level.toString());

      return getUserSettings();
    } catch (err) {
      console.warn('SQLite updateUserSettings error, falling back to memory store:', err);
    }
  }

  const store = getMemoryStore();
  store.userSettings = {
    ...store.userSettings,
    ...settings,
    daily_limit: settings.daily_limit !== undefined ? Math.max(5, settings.daily_limit) : store.userSettings.daily_limit,
    user_name: settings.user_name !== undefined ? settings.user_name.trim() || 'Học viên' : store.userSettings.user_name,
  };
  return toPlain(store.userSettings);
}

export function getStudyStats(): StudyStats {
  const now = new Date().toISOString();
  const db = getDatabase();

  if (db) {
    try {
      const totalCardsRow = db.prepare('SELECT COUNT(*) as count FROM cards').get() as { count: number };
      const newCardsRow = db.prepare("SELECT COUNT(*) as count FROM cards WHERE status = 'new'").get() as { count: number };
      const learningCardsRow = db.prepare("SELECT COUNT(*) as count FROM cards WHERE status = 'learning'").get() as { count: number };
      const masteredCardsRow = db.prepare("SELECT COUNT(*) as count FROM cards WHERE status = 'mastered'").get() as { count: number };
      const dueTodayRow = db.prepare('SELECT COUNT(*) as count FROM cards WHERE due_date <= ?').get(now) as { count: number };
      const totalReviewsRow = db.prepare('SELECT COUNT(*) as count FROM review_logs').get() as { count: number };

      const todayPrefix = now.substring(0, 10);
      const todayReviewsRow = db.prepare('SELECT COUNT(*) as count FROM review_logs WHERE reviewed_at LIKE ?').get(`${todayPrefix}%`) as { count: number };

      const successReviewsRow = db.prepare('SELECT COUNT(*) as count FROM review_logs WHERE rating >= 3').get() as { count: number };
      const retentionRate = totalReviewsRow.count > 0 
        ? Math.round((successReviewsRow.count / totalReviewsRow.count) * 100) 
        : 100;

      const streakRows = db.prepare(`
        SELECT DISTINCT SUBSTR(reviewed_at, 1, 10) as review_day 
        FROM review_logs 
        ORDER BY review_day DESC 
        LIMIT 30
      `).all() as Array<{ review_day: string }>;
      const streakDays = Math.max(1, streakRows.length);

      const categories: CategoryInfo[] = CATEGORIES_CONFIG.map((cfg) => {
        const totalRow = db.prepare('SELECT COUNT(*) as count FROM cards WHERE category = ?').get(cfg.id) as { count: number };
        const newRow = db.prepare("SELECT COUNT(*) as count FROM cards WHERE category = ? AND status = 'new'").get(cfg.id) as { count: number };
        const learningRow = db.prepare("SELECT COUNT(*) as count FROM cards WHERE category = ? AND status = 'learning'").get(cfg.id) as { count: number };
        const reviewingRow = db.prepare('SELECT COUNT(*) as count FROM cards WHERE category = ? AND due_date <= ?').get(cfg.id, now) as { count: number };
        const masteredRow = db.prepare("SELECT COUNT(*) as count FROM cards WHERE category = ? AND status = 'mastered'").get(cfg.id) as { count: number };

        return {
          id: cfg.id,
          name: cfg.name,
          icon: cfg.icon,
          color: cfg.color,
          total: totalRow.count,
          new_count: newRow.count,
          learning_count: learningRow.count,
          reviewing_count: reviewingRow.count,
          mastered_count: masteredRow.count,
        };
      });

      const statsObj = {
        total_cards: totalCardsRow.count,
        new_cards: newCardsRow.count,
        learning_cards: learningCardsRow.count,
        reviewing_cards: dueTodayRow.count,
        mastered_cards: masteredCardsRow.count,
        due_today: dueTodayRow.count,
        retention_rate: retentionRate,
        streak_days: streakDays,
        total_reviews: totalReviewsRow.count,
        today_reviewed_count: todayReviewsRow.count,
        categories,
      };

      return toPlain(statsObj);
    } catch (err) {
      console.warn('SQLite getStudyStats error, falling back to memory store:', err);
    }
  }

  // In-Memory Fallback
  const store = getMemoryStore();
  const totalCards = store.cards.length;
  const newCards = store.cards.filter((c) => c.status === 'new').length;
  const learningCards = store.cards.filter((c) => c.status === 'learning').length;
  const masteredCards = store.cards.filter((c) => c.status === 'mastered').length;
  const dueToday = store.cards.filter((c) => c.due_date <= now || c.status === 'new').length;

  const totalReviews = store.reviewLogs.length;
  const todayPrefix = now.substring(0, 10);
  const todayReviews = store.reviewLogs.filter((l) => l.reviewed_at.startsWith(todayPrefix)).length;

  const successReviews = store.reviewLogs.filter((l) => l.rating >= 3).length;
  const retentionRate = totalReviews > 0 ? Math.round((successReviews / totalReviews) * 100) : 100;

  const distinctDays = new Set(store.reviewLogs.map((l) => l.reviewed_at.substring(0, 10)));
  const streakDays = Math.max(1, distinctDays.size);

  const categories: CategoryInfo[] = CATEGORIES_CONFIG.map((cfg) => {
    const catCards = store.cards.filter((c) => c.category === cfg.id);
    return {
      id: cfg.id,
      name: cfg.name,
      icon: cfg.icon,
      color: cfg.color,
      total: catCards.length,
      new_count: catCards.filter((c) => c.status === 'new').length,
      learning_count: catCards.filter((c) => c.status === 'learning').length,
      reviewing_count: catCards.filter((c) => c.due_date <= now && c.status !== 'new').length,
      mastered_count: catCards.filter((c) => c.status === 'mastered').length,
    };
  });

  return toPlain({
    total_cards: totalCards,
    new_cards: newCards,
    learning_cards: learningCards,
    reviewing_cards: dueToday,
    mastered_cards: masteredCards,
    due_today: dueToday,
    retention_rate: retentionRate,
    streak_days: streakDays,
    total_reviews: totalReviews,
    today_reviewed_count: todayReviews,
    categories,
  });
}

export function resetDatabase() {
  const db = getDatabase();
  if (db) {
    try {
      db.exec('DROP TABLE IF EXISTS review_logs;');
      db.exec('DROP TABLE IF EXISTS life_questions;');
      db.exec('DROP TABLE IF EXISTS char_details;');
      db.exec('DROP TABLE IF EXISTS cards;');
      db.exec('DROP TABLE IF EXISTS user_settings;');
      initDatabase(db);
    } catch (err) {
      console.warn('SQLite resetDatabase error:', err);
    }
  }

  globalThis.__inMemoryStoreInstance = initMemoryStore();
}
