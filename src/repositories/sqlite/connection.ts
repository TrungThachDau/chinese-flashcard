import path from 'path';
import fs from 'fs';
import os from 'os';
import { createRequire } from 'node:module';
import {
  Card,
  CardStatus,
  CharDetail,
  LifeQuestion,
  ReviewLog,
  UserSettings,
  DEFAULT_USER_SETTINGS,
} from '@/models';
import { INITIAL_CHAR_DETAILS, INITIAL_LIFE_QUESTIONS } from '@/models/data/initialData';
import { HSK30_LEVEL1_CARDS, HSK30_CHAR_DETAILS } from '@/models/data/hsk30Data';

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

export interface MemoryStore {
  cards: Card[];
  charDetails: Map<string, CharDetail>;
  lifeQuestions: LifeQuestion[];
  reviewLogs: ReviewLog[];
  userSettings: UserSettings;
}

// Global declaration for hot-reloading and lambda instance caching
declare global {
  // eslint-disable-next-line no-var
  var __sqliteDbInstance: any;
  // eslint-disable-next-line no-var
  var __inMemoryStoreInstance: MemoryStore | undefined;
}

export function initMemoryStore(): MemoryStore {
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

  return {
    cards,
    charDetails,
    lifeQuestions,
    reviewLogs: [],
    userSettings: { ...DEFAULT_USER_SETTINGS },
  };
}

export function getMemoryStore(): MemoryStore {
  if (!globalThis.__inMemoryStoreInstance) {
    globalThis.__inMemoryStoreInstance = initMemoryStore();
  }
  return globalThis.__inMemoryStoreInstance;
}

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
export function getDatabase(): any | null {
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
export function initDatabase(db: any) {
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

  db.exec(`
    CREATE TABLE IF NOT EXISTS user_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  const defaultSettings: Record<string, string> = {
    user_name: DEFAULT_USER_SETTINGS.user_name,
    daily_limit: String(DEFAULT_USER_SETTINGS.daily_limit),
    speech_rate: String(DEFAULT_USER_SETTINGS.speech_rate),
    audio_engine: DEFAULT_USER_SETTINGS.audio_engine,
    auto_play_audio: String(DEFAULT_USER_SETTINGS.auto_play_audio),
    has_onboarded: String(DEFAULT_USER_SETTINGS.has_onboarded),
    hsk_level: String(DEFAULT_USER_SETTINGS.hsk_level),
    fsrs_retention: String(DEFAULT_USER_SETTINGS.fsrs_retention ?? 0.9),
  };

  for (const [k, v] of Object.entries(defaultSettings)) {
    db.prepare('INSERT OR IGNORE INTO user_settings (key, value) VALUES (?, ?)').run(k, v);
  }

  const countRow = db.prepare('SELECT COUNT(*) as count FROM cards').get() as { count: number };
  if (!countRow || countRow.count === 0) {
    seedDatabase(db);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function seedDatabase(db: any = getDatabase()) {
  if (!db) return;
  const now = new Date().toISOString();

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
      card.sino_vietnamese ?? '',
      card.category,
      card.category_name,
      card.example_sentence ?? '',
      card.example_pinyin ?? '',
      card.example_meaning ?? '',
      0,
      0,
      2.5,
      now,
      null,
      'new'
    );
  }

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

export function resetSqliteAndMemory() {
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

export function toPlain<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

