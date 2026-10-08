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
import { calculateFSRS, calculateSM2 } from './srs';

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
    stability: 0,
    difficulty: 0,
    lapses: 0,
    state: 0,
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
    fsrs_retention: 0.9,
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
      status TEXT DEFAULT 'new',
      stability REAL DEFAULT 0,
      difficulty REAL DEFAULT 0,
      lapses INTEGER DEFAULT 0,
      state INTEGER DEFAULT 0
    );
  `);

  // Safe migrations for cards table
  const cardMigrations = [
    'ALTER TABLE cards ADD COLUMN stability REAL DEFAULT 0',
    'ALTER TABLE cards ADD COLUMN difficulty REAL DEFAULT 0',
    'ALTER TABLE cards ADD COLUMN lapses INTEGER DEFAULT 0',
    'ALTER TABLE cards ADD COLUMN state INTEGER DEFAULT 0',
  ];
  for (const sql of cardMigrations) {
    try {
      db.exec(sql);
    } catch {
      // Column likely already exists
    }
  }

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
      ease_factor REAL NOT NULL,
      stability REAL DEFAULT 0,
      difficulty REAL DEFAULT 0
    );
  `);

  // Safe migrations for review_logs table
  const reviewLogMigrations = [
    'ALTER TABLE review_logs ADD COLUMN stability REAL DEFAULT 0',
    'ALTER TABLE review_logs ADD COLUMN difficulty REAL DEFAULT 0',
  ];
  for (const sql of reviewLogMigrations) {
    try {
      db.exec(sql);
    } catch {
      // Column likely already exists
    }
  }

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
    fsrs_retention: '0.9',
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

export interface CardFilterOptions {
  category?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export function getAllCards(filters?: CardFilterOptions): Card[] {
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

      if (typeof filters?.limit === 'number' && filters.limit > 0) {
        query += ' LIMIT ?';
        params.push(filters.limit);
        if (typeof filters?.offset === 'number' && filters.offset > 0) {
          query += ' OFFSET ?';
          params.push(filters.offset);
        }
      }

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

  if (typeof filters?.limit === 'number' && filters.limit > 0) {
    const offset = typeof filters?.offset === 'number' && filters.offset > 0 ? filters.offset : 0;
    result = result.slice(offset, offset + filters.limit);
  }

  return toPlain(result);
}

export function getCardsCount(filters?: CardFilterOptions): number {
  const db = getDatabase();
  if (db) {
    try {
      let query = 'SELECT COUNT(*) as count FROM cards WHERE 1=1';
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

      const row = db.prepare(query).get(...params) as { count: number } | undefined;
      return row?.count ?? 0;
    } catch (err) {
      console.warn('SQLite getCardsCount error, falling back to memory store:', err);
    }
  }

  // Memory fallback
  const store = getMemoryStore();
  const now = new Date().toISOString();
  let result = store.cards;

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

  return result.length;
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

export function getLearnedCards(limit: number = 20): Card[] {
  const db = getDatabase();
  if (db) {
    try {
      const rows = db.prepare(`
        SELECT * FROM cards
        WHERE status != 'new' OR last_reviewed IS NOT NULL
        ORDER BY last_reviewed DESC, due_date ASC
        LIMIT ?
      `).all(limit);
      return toPlain(rows as unknown as Card[]);
    } catch (err) {
      console.warn('SQLite getLearnedCards error, falling back to memory store:', err);
    }
  }

  const store = getMemoryStore();
  const learned = store.cards
    .filter((c) => c.status !== 'new' || c.last_reviewed !== null)
    .sort((a, b) => {
      const timeA = a.last_reviewed || '';
      const timeB = b.last_reviewed || '';
      return timeB.localeCompare(timeA);
    });
  return toPlain(learned.slice(0, limit));
}

export function getNewCards(limit: number = 5): Card[] {
  const db = getDatabase();
  if (db) {
    try {
      const rows = db.prepare(`
        SELECT * FROM cards
        WHERE status = 'new'
        ORDER BY id ASC
        LIMIT ?
      `).all(limit);
      return toPlain(rows as unknown as Card[]);
    } catch (err) {
      console.warn('SQLite getNewCards error, falling back to memory store:', err);
    }
  }

  const store = getMemoryStore();
  const newCards = store.cards.filter((c) => c.status === 'new');
  return toPlain(newCards.slice(0, limit));
}

export function getDueCards(limit?: number, allowNew: boolean = true): Card[] {
  const settings = getUserSettings();
  const maxLimit = limit ?? settings.daily_limit;
  const now = new Date().toISOString();

  const db = getDatabase();
  if (db) {
    try {
      let query: string;
      const params: (string | number)[] = [];

      if (allowNew) {
        query = `
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
        `;
        params.push(now, maxLimit);
      } else {
        query = `
          SELECT * FROM cards 
          WHERE due_date <= ? AND status != 'new'
          ORDER BY 
            CASE status 
              WHEN 'learning' THEN 1 
              WHEN 'reviewing' THEN 2 
              ELSE 3 
            END,
            due_date ASC 
          LIMIT ?
        `;
        params.push(now, maxLimit);
      }

      const rows = db.prepare(query).all(...params);
      return toPlain(rows as unknown as Card[]);
    } catch (err) {
      console.warn('SQLite getDueCards error, falling back to memory store:', err);
    }
  }

  // In-Memory Fallback
  const store = getMemoryStore();
  const due = store.cards.filter((c) => {
    if (allowNew) {
      return c.due_date <= now || c.status === 'new';
    }
    return c.due_date <= now && c.status !== 'new';
  });

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
  const settings = getUserSettings();
  const targetRetention = settings.fsrs_retention ?? 0.9;
  const srsResult = calculateFSRS(currentCard, rating, now, targetRetention);

  const db = getDatabase();
  if (db) {
    try {
      // Card update + review log must succeed or fail together
      db.exec('BEGIN');
      db.prepare(`
        UPDATE cards SET
          repetition = ?,
          interval = ?,
          ease_factor = ?,
          due_date = ?,
          last_reviewed = ?,
          status = ?,
          stability = ?,
          difficulty = ?,
          lapses = ?,
          state = ?
        WHERE id = ?
      `).run(
        srsResult.repetition,
        srsResult.interval,
        srsResult.ease_factor,
        srsResult.due_date,
        now.toISOString(),
        srsResult.status,
        srsResult.stability ?? 0,
        srsResult.difficulty ?? 0,
        srsResult.lapses ?? 0,
        srsResult.state ?? 0,
        cardId
      );

      db.prepare(`
        INSERT INTO review_logs (card_id, rating, reviewed_at, interval, ease_factor, stability, difficulty)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        cardId,
        rating,
        now.toISOString(),
        srsResult.interval,
        srsResult.ease_factor,
        srsResult.stability ?? 0,
        srsResult.difficulty ?? 0
      );
      db.exec('COMMIT');

      return getCardById(cardId);
    } catch (err) {
      try { db.exec('ROLLBACK'); } catch {}
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
    stability: srsResult.stability,
    difficulty: srsResult.difficulty,
    lapses: srsResult.lapses,
    state: srsResult.state,
  };

  store.cards[cardIndex] = updated;

  store.reviewLogs.push({
    id: store.reviewLogs.length + 1,
    card_id: cardId,
    rating,
    reviewed_at: now.toISOString(),
    interval: srsResult.interval,
    ease_factor: srsResult.ease_factor,
    stability: srsResult.stability,
    difficulty: srsResult.difficulty,
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
      const parsedDailyLimit = parseInt(map.daily_limit || '15', 10);
      const parsedHskLevel = parseInt(map.hsk_level || '1', 10);
      const parsedSpeechRate = parseFloat(map.speech_rate || '0.85');
      const parsedFsrsRetention = parseFloat(map.fsrs_retention || '0.9');

      return toPlain({
        user_name: map.user_name || 'Học viên',
        daily_limit: Number.isNaN(parsedDailyLimit) || parsedDailyLimit < 5 ? 15 : parsedDailyLimit,
        speech_rate: Number.isNaN(parsedSpeechRate) ? 0.85 : parsedSpeechRate,
        audio_engine: (map.audio_engine === 'browser' ? 'browser' : 'online') as 'online' | 'browser',
        auto_play_audio: map.auto_play_audio === 'true',
        has_onboarded: map.has_onboarded === 'true',
        hsk_level: Number.isNaN(parsedHskLevel) ? 1 : parsedHskLevel,
        fsrs_retention: Number.isNaN(parsedFsrsRetention) ? 0.9 : Math.min(0.97, Math.max(0.75, parsedFsrsRetention)),
      });
    } catch (err) {
      console.warn('SQLite getUserSettings error, falling back to memory store:', err);
    }
  }

  const store = getMemoryStore();
  return toPlain(store.userSettings);
}

export function updateUserSettings(settings: Partial<UserSettings>): UserSettings {
  // Always keep in-memory store in sync as well
  const store = getMemoryStore();
  store.userSettings = {
    ...store.userSettings,
    ...settings,
    daily_limit: settings.daily_limit !== undefined ? Math.max(5, settings.daily_limit) : store.userSettings.daily_limit,
    user_name: settings.user_name !== undefined ? settings.user_name.trim() || 'Học viên' : store.userSettings.user_name,
    fsrs_retention: settings.fsrs_retention !== undefined ? Math.min(0.97, Math.max(0.75, settings.fsrs_retention)) : store.userSettings.fsrs_retention,
  };

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
      if (settings.fsrs_retention !== undefined) {
        const clamped = Math.min(0.97, Math.max(0.75, settings.fsrs_retention));
        updateStmt.run('fsrs_retention', clamped.toString());
      }

      return getUserSettings();
    } catch (err) {
      console.warn('SQLite updateUserSettings error, falling back to memory store:', err);
    }
  }

  return toPlain(store.userSettings);
}

/**
 * Day boundaries are computed in the *learner's* timezone, not UTC, so that
 * "today's reviews" and the streak roll over at local midnight.
 * `tzOffsetMinutes` follows `Date.prototype.getTimezoneOffset()` (UTC+7 -> -420).
 */
function getLocalDayInfo(tzOffsetMinutes: number, nowDate: Date = new Date()) {
  const offsetMs = -tzOffsetMinutes * 60_000;
  const DAY = 86_400_000;
  const startMs = Math.floor((nowDate.getTime() + offsetMs) / DAY) * DAY - offsetMs;
  return {
    startIso: new Date(startMs).toISOString(),
    endIso: new Date(startMs + DAY).toISOString(),
    todayKey: new Date(nowDate.getTime() + offsetMs).toISOString().substring(0, 10),
    // SQLite date() modifier that shifts a UTC timestamp into local time
    sqlModifier: `${-tzOffsetMinutes >= 0 ? '+' : '-'}${Math.abs(tzOffsetMinutes)} minutes`,
    offsetMs,
  };
}

/** Consecutive local days with at least one review, ending today (or yesterday). */
function computeStreak(days: Iterable<string>, todayKey: string): number {
  const set = new Set(days);
  const DAY = 86_400_000;
  let cursor = Date.parse(`${todayKey}T00:00:00Z`);
  if (!set.has(todayKey)) cursor -= DAY; // streak is still alive until today ends
  let streak = 0;
  while (set.has(new Date(cursor).toISOString().substring(0, 10))) {
    streak += 1;
    cursor -= DAY;
  }
  return streak;
}

export function getStudyStats(tzOffsetMinutes: number = new Date().getTimezoneOffset()): StudyStats {
  const nowDate = new Date();
  const now = nowDate.toISOString();
  const day = getLocalDayInfo(tzOffsetMinutes, nowDate);
  const db = getDatabase();

  if (db) {
    try {
      const totalCardsRow = db.prepare('SELECT COUNT(*) as count FROM cards').get() as { count: number };
      const newCardsRow = db.prepare("SELECT COUNT(*) as count FROM cards WHERE status = 'new'").get() as { count: number };
      const learningCardsRow = db.prepare("SELECT COUNT(*) as count FROM cards WHERE status = 'learning'").get() as { count: number };
      const masteredCardsRow = db.prepare("SELECT COUNT(*) as count FROM cards WHERE status = 'mastered'").get() as { count: number };
      const dueTodayRow = db.prepare('SELECT COUNT(*) as count FROM cards WHERE due_date <= ?').get(now) as { count: number };
      const totalReviewsRow = db.prepare('SELECT COUNT(*) as count FROM review_logs').get() as { count: number };

      const todayReviewsRow = db
        .prepare('SELECT COUNT(DISTINCT card_id) as count FROM review_logs WHERE reviewed_at >= ? AND reviewed_at < ?')
        .get(day.startIso, day.endIso) as { count: number };

      const successReviewsRow = db.prepare('SELECT COUNT(*) as count FROM review_logs WHERE rating >= 3').get() as { count: number };
      const retentionRate = totalReviewsRow.count > 0 
        ? Math.round((successReviewsRow.count / totalReviewsRow.count) * 100) 
        : 100;

      const streakRows = db.prepare(`
        SELECT DISTINCT date(reviewed_at, ?) as review_day
        FROM review_logs
        ORDER BY review_day DESC
        LIMIT 400
      `).all(day.sqlModifier) as Array<{ review_day: string }>;
      const streakDays = computeStreak(streakRows.map((r) => r.review_day), day.todayKey);

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
  const todayReviews = new Set(
    store.reviewLogs
      .filter((l) => l.reviewed_at >= day.startIso && l.reviewed_at < day.endIso)
      .map((l) => l.card_id)
  ).size;

  const successReviews = store.reviewLogs.filter((l) => l.rating >= 3).length;
  const retentionRate = totalReviews > 0 ? Math.round((successReviews / totalReviews) * 100) : 100;

  const distinctDays = store.reviewLogs.map((l) =>
    new Date(Date.parse(l.reviewed_at) + day.offsetMs).toISOString().substring(0, 10)
  );
  const streakDays = computeStreak(distinctDays, day.todayKey);

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
  // Safety net: snapshot learner progress to data/backups before dropping anything
  try {
    const backup = exportProgress();
    if (backup.cards.length > 0 || backup.review_logs.length > 0) {
      const dir = path.join(process.cwd(), 'data', 'backups');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(
        path.join(dir, `progress-before-reset-${Date.now()}.json`),
        JSON.stringify(backup, null, 2)
      );
    }
  } catch (err) {
    console.warn('Could not write pre-reset backup:', err);
  }

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

// ---------------------------------------------------------------------------
// 4. PORTABLE BACKUP FORMAT (lossless SQLite <-> Supabase migration)
// ---------------------------------------------------------------------------
// Progress is keyed by a *stable* card key (`hanzi|pinyin`, unique across all
// 537 HSK 3.0 L1 cards) instead of the auto-increment `id`, which is only an
// artefact of the local seed order and would differ in another database.

export const BACKUP_FORMAT = 'chinese-flashcard-backup';
export const BACKUP_VERSION = 1;

export function makeCardKey(card: Pick<Card, 'hanzi' | 'pinyin'>): string {
  return `${card.hanzi}|${card.pinyin}`;
}

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

function getAllReviewLogs(): ReviewLog[] {
  const db = getDatabase();
  if (db) {
    try {
      return toPlain(db.prepare('SELECT * FROM review_logs ORDER BY id ASC').all() as unknown as ReviewLog[]);
    } catch (err) {
      console.warn('SQLite getAllReviewLogs error, falling back to memory store:', err);
    }
  }
  return toPlain(getMemoryStore().reviewLogs);
}

/** Snapshot of everything the learner has produced (never the static seed content). */
export function exportProgress(): ProgressBackup {
  const cards = getAllCards();
  const keyById = new Map<number, string>(cards.map((c) => [c.id, makeCardKey(c)]));

  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exported_at: new Date().toISOString(),
    settings: getUserSettings(),
    cards: cards
      .filter((c) => c.status !== 'new' || c.last_reviewed !== null)
      .map((c) => ({
        key: makeCardKey(c),
        hanzi: c.hanzi,
        pinyin: c.pinyin,
        repetition: c.repetition,
        interval: c.interval,
        ease_factor: c.ease_factor,
        due_date: c.due_date,
        last_reviewed: c.last_reviewed,
        status: c.status,
        stability: c.stability ?? 0,
        difficulty: c.difficulty ?? 0,
        lapses: c.lapses ?? 0,
        state: c.state ?? 0,
      })),
    review_logs: getAllReviewLogs()
      .filter((l) => keyById.has(l.card_id))
      .map((l) => ({
        card_key: keyById.get(l.card_id)!,
        rating: l.rating,
        reviewed_at: l.reviewed_at,
        interval: l.interval,
        ease_factor: l.ease_factor,
        stability: l.stability ?? 0,
        difficulty: l.difficulty ?? 0,
      })),
    life_questions: getLifeQuestions()
      .filter((q) => q.completed || q.last_practiced)
      .map((q) => ({ id: q.id, completed: q.completed, last_practiced: q.last_practiced })),
  };
}

export interface ImportResult {
  cards: number;
  review_logs: number;
  life_questions: number;
  skipped_cards: number;
}

/**
 * Restore a backup. Idempotent: running it twice yields the same state
 * (cards are matched by key, review logs deduped on card + timestamp).
 */
export function importProgress(backup: ProgressBackup): ImportResult {
  if (!backup || backup.format !== BACKUP_FORMAT || !Array.isArray(backup.cards)) {
    throw new Error('Invalid backup file');
  }
  if (backup.version > BACKUP_VERSION) {
    throw new Error(`Backup version ${backup.version} is newer than supported (${BACKUP_VERSION})`);
  }

  const result: ImportResult = { cards: 0, review_logs: 0, life_questions: 0, skipped_cards: 0 };
  const cards = getAllCards();
  const idByKey = new Map<string, number>(cards.map((c) => [makeCardKey(c), c.id]));
  const db = getDatabase();

  if (db) {
    try {
      db.exec('BEGIN');
      const updateCard = db.prepare(`
        UPDATE cards SET repetition = ?, interval = ?, ease_factor = ?, due_date = ?, last_reviewed = ?, status = ?,
                         stability = ?, difficulty = ?, lapses = ?, state = ?
        WHERE id = ?
      `);
      for (const c of backup.cards) {
        const id = idByKey.get(c.key);
        if (!id) { result.skipped_cards += 1; continue; }
        updateCard.run(
          c.repetition, c.interval, c.ease_factor, c.due_date, c.last_reviewed, c.status,
          c.stability ?? 0, c.difficulty ?? 0, c.lapses ?? 0, c.state ?? 0,
          id
        );
        result.cards += 1;
      }

      const existsLog = db.prepare('SELECT 1 FROM review_logs WHERE card_id = ? AND reviewed_at = ?');
      const insertLog = db.prepare(
        'INSERT INTO review_logs (card_id, rating, reviewed_at, interval, ease_factor, stability, difficulty) VALUES (?, ?, ?, ?, ?, ?, ?)'
      );
      for (const l of backup.review_logs || []) {
        const id = idByKey.get(l.card_key);
        if (!id || existsLog.get(id, l.reviewed_at)) continue;
        insertLog.run(id, l.rating, l.reviewed_at, l.interval, l.ease_factor, l.stability ?? 0, l.difficulty ?? 0);
        result.review_logs += 1;
      }

      const updateQ = db.prepare('UPDATE life_questions SET completed = ?, last_practiced = ? WHERE id = ?');
      for (const q of backup.life_questions || []) {
        updateQ.run(q.completed ? 1 : 0, q.last_practiced, q.id);
        result.life_questions += 1;
      }
      db.exec('COMMIT');
    } catch (err) {
      try { db.exec('ROLLBACK'); } catch {}
      throw err;
    }
  } else {
    const store = getMemoryStore();
    for (const c of backup.cards) {
      const idx = store.cards.findIndex((x) => makeCardKey(x) === c.key);
      if (idx === -1) { result.skipped_cards += 1; continue; }
      store.cards[idx] = { ...store.cards[idx], ...c, id: store.cards[idx].id } as Card;
      result.cards += 1;
    }
    for (const l of backup.review_logs || []) {
      const id = idByKey.get(l.card_key);
      if (!id || store.reviewLogs.some((x) => x.card_id === id && x.reviewed_at === l.reviewed_at)) continue;
      store.reviewLogs.push({
        id: store.reviewLogs.length + 1,
        card_id: id,
        rating: l.rating,
        reviewed_at: l.reviewed_at,
        interval: l.interval,
        ease_factor: l.ease_factor,
      });
      result.review_logs += 1;
    }
    for (const q of backup.life_questions || []) {
      const item = store.lifeQuestions.find((x) => x.id === q.id);
      if (item) { item.completed = q.completed; item.last_practiced = q.last_practiced; result.life_questions += 1; }
    }
  }

  if (backup.settings) updateUserSettings(backup.settings);
  return result;
}
