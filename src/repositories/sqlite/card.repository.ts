import {
  Card,
  CardFilterOptions,
  CardStatus,
  ReviewLog,
  ReviewRating,
  BackupCardProgress,
  BackupReviewLog,
  makeCardKey,
} from '@/models';
import { getDatabase, getMemoryStore, toPlain } from './connection';

function mapCardRow(row: any): Card {
  if (!row) return row;
  let tags = row.tags;
  if (typeof tags === 'string') {
    try {
      tags = JSON.parse(tags);
    } catch {
      tags = tags ? [tags] : ['HSK 1'];
    }
  } else if (!tags) {
    tags = row.hsk ? [`HSK ${row.hsk}`] : ['HSK 1'];
  }
  return {
    ...row,
    hsk: row.hsk ?? 1,
    tags: Array.isArray(tags) ? tags : ['HSK 1'],
  };
}

export function findAllCards(filters?: CardFilterOptions): Card[] {
  const db = getDatabase();
  if (db) {
    try {
      let query = 'SELECT * FROM cards WHERE 1=1';
      const params: (string | number | null)[] = [];

      if (filters?.hsk && filters.hsk !== 'all') {
        query += ' AND hsk = ?';
        params.push(Number(filters.hsk));
      }

      if (filters?.tag && filters.tag !== 'all') {
        query += ' AND tags LIKE ?';
        params.push(`%"${filters.tag}"%`);
      }

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
        query += ' AND (hanzi LIKE ? OR pinyin LIKE ? OR meaning LIKE ? OR sino_vietnamese LIKE ? OR tags LIKE ?)';
        params.push(term, term, term, term, term);
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
      return toPlain((rows as unknown as Card[]).map(mapCardRow));
    } catch (err) {
      console.warn('SQLite findAllCards error, falling back to memory store:', err);
    }
  }

  const store = getMemoryStore();
  const now = new Date().toISOString();
  let result = [...store.cards];

  if (filters?.hsk && filters.hsk !== 'all') {
    result = result.filter((c) => c.hsk === Number(filters.hsk));
  }

  if (filters?.tag && filters.tag !== 'all') {
    result = result.filter((c) => c.tags?.includes(filters.tag as string));
  }

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
        (c.sino_vietnamese?.toLowerCase().includes(term) ?? false) ||
        (c.tags?.some((t) => t.toLowerCase().includes(term)) ?? false) ||
        (c.hsk ? `hsk ${c.hsk}`.toLowerCase().includes(term) : false)
    );
  }

  result.sort((a, b) => a.id - b.id);

  if (typeof filters?.limit === 'number' && filters.limit > 0) {
    const offset = typeof filters?.offset === 'number' && filters.offset > 0 ? filters.offset : 0;
    result = result.slice(offset, offset + filters.limit);
  }

  return toPlain(result);
}

export function countCards(filters?: CardFilterOptions): number {
  const db = getDatabase();
  if (db) {
    try {
      let query = 'SELECT COUNT(*) as count FROM cards WHERE 1=1';
      const params: (string | number | null)[] = [];

      if (filters?.hsk && filters.hsk !== 'all') {
        query += ' AND hsk = ?';
        params.push(Number(filters.hsk));
      }

      if (filters?.tag && filters.tag !== 'all') {
        query += ' AND tags LIKE ?';
        params.push(`%"${filters.tag}"%`);
      }

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
        query += ' AND (hanzi LIKE ? OR pinyin LIKE ? OR meaning LIKE ? OR sino_vietnamese LIKE ? OR tags LIKE ?)';
        params.push(term, term, term, term, term);
      }

      const row = db.prepare(query).get(...params) as { count: number } | undefined;
      return row?.count ?? 0;
    } catch (err) {
      console.warn('SQLite countCards error, falling back to memory store:', err);
    }
  }

  const store = getMemoryStore();
  const now = new Date().toISOString();
  let result = store.cards;

  if (filters?.hsk && filters.hsk !== 'all') {
    result = result.filter((c) => c.hsk === Number(filters.hsk));
  }

  if (filters?.tag && filters.tag !== 'all') {
    result = result.filter((c) => c.tags?.includes(filters.tag as string));
  }

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
        (c.sino_vietnamese?.toLowerCase().includes(term) ?? false) ||
        (c.tags?.some((t) => t.toLowerCase().includes(term)) ?? false) ||
        (c.hsk ? `hsk ${c.hsk}`.toLowerCase().includes(term) : false)
    );
  }

  return result.length;
}

export function findCardById(id: number): Card | null {
  const db = getDatabase();
  if (db) {
    try {
      const row = db.prepare('SELECT * FROM cards WHERE id = ?').get(id);
      return row ? toPlain(mapCardRow(row)) : null;
    } catch (err) {
      console.warn('SQLite findCardById error, falling back to memory store:', err);
    }
  }

  const store = getMemoryStore();
  const card = store.cards.find((c) => c.id === id);
  return card ? toPlain(card) : null;
}

export function findLearnedCards(limit: number = 20): Card[] {
  const db = getDatabase();
  if (db) {
    try {
      const rows = db.prepare(`
        SELECT * FROM cards
        WHERE status != 'new' OR last_reviewed IS NOT NULL
        ORDER BY last_reviewed DESC, due_date ASC
        LIMIT ?
      `).all(limit);
      return toPlain((rows as unknown as Card[]).map(mapCardRow));
    } catch (err) {
      console.warn('SQLite findLearnedCards error, falling back to memory store:', err);
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

export function findNewCards(limit: number = 5): Card[] {
  const db = getDatabase();
  if (db) {
    try {
      const rows = db.prepare(`
        SELECT * FROM cards
        WHERE status = 'new'
        ORDER BY id ASC
        LIMIT ?
      `).all(limit);
      return toPlain((rows as unknown as Card[]).map(mapCardRow));
    } catch (err) {
      console.warn('SQLite findNewCards error, falling back to memory store:', err);
    }
  }

  const store = getMemoryStore();
  const newCards = store.cards.filter((c) => c.status === 'new');
  return toPlain(newCards.slice(0, limit));
}

export function findDueCards(maxLimit: number, allowNew: boolean = true): Card[] {
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
      return toPlain((rows as unknown as Card[]).map(mapCardRow));
    } catch (err) {
      console.warn('SQLite findDueCards error, falling back to memory store:', err);
    }
  }

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

export function updateCardAndInsertReview(
  cardId: number,
  rating: ReviewRating,
  reviewedAtIso: string,
  srsUpdate: {
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
): Card | null {
  const db = getDatabase();
  if (db) {
    try {
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
        srsUpdate.repetition,
        srsUpdate.interval,
        srsUpdate.ease_factor,
        srsUpdate.due_date,
        reviewedAtIso,
        srsUpdate.status,
        srsUpdate.stability ?? 0,
        srsUpdate.difficulty ?? 0,
        srsUpdate.lapses ?? 0,
        srsUpdate.state ?? 0,
        cardId
      );

      db.prepare(`
        INSERT INTO review_logs (card_id, rating, reviewed_at, interval, ease_factor, stability, difficulty)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        cardId,
        rating,
        reviewedAtIso,
        srsUpdate.interval,
        srsUpdate.ease_factor,
        srsUpdate.stability ?? 0,
        srsUpdate.difficulty ?? 0
      );
      db.exec('COMMIT');

      return findCardById(cardId);
    } catch (err) {
      try { db.exec('ROLLBACK'); } catch {}
      console.warn('SQLite updateCardAndInsertReview error, falling back to memory store:', err);
    }
  }

  const store = getMemoryStore();
  const cardIndex = store.cards.findIndex((c) => c.id === cardId);
  if (cardIndex === -1) return null;

  const updated: Card = {
    ...store.cards[cardIndex],
    repetition: srsUpdate.repetition,
    interval: srsUpdate.interval,
    ease_factor: srsUpdate.ease_factor,
    due_date: srsUpdate.due_date,
    last_reviewed: reviewedAtIso,
    status: srsUpdate.status,
    stability: srsUpdate.stability,
    difficulty: srsUpdate.difficulty,
    lapses: srsUpdate.lapses,
    state: srsUpdate.state,
  };

  store.cards[cardIndex] = updated;

  store.reviewLogs.push({
    id: store.reviewLogs.length + 1,
    card_id: cardId,
    rating,
    reviewed_at: reviewedAtIso,
    interval: srsUpdate.interval,
    ease_factor: srsUpdate.ease_factor,
    stability: srsUpdate.stability,
    difficulty: srsUpdate.difficulty,
  });

  return toPlain(updated);
}

export function batchUpdateCardsAndInsertReviews(
  reviews: Array<{
    card_id: number;
    rating: ReviewRating;
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
  }>
): void {
  if (!reviews || reviews.length === 0) return;

  const db = getDatabase();
  if (db) {
    try {
      db.exec('BEGIN');
      const updateStmt = db.prepare(`
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
      `);
      const insertStmt = db.prepare(`
        INSERT INTO review_logs (card_id, rating, reviewed_at, interval, ease_factor, stability, difficulty)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const r of reviews) {
        updateStmt.run(
          r.repetition,
          r.interval,
          r.ease_factor,
          r.due_date,
          r.reviewed_at,
          r.status,
          r.stability ?? 0,
          r.difficulty ?? 0,
          r.lapses ?? 0,
          r.state ?? 0,
          r.card_id
        );
        insertStmt.run(
          r.card_id,
          r.rating,
          r.reviewed_at,
          r.interval,
          r.ease_factor,
          r.stability ?? 0,
          r.difficulty ?? 0
        );
      }
      db.exec('COMMIT');
      return;
    } catch (err) {
      try { db.exec('ROLLBACK'); } catch {}
      console.warn('SQLite batchUpdateCardsAndInsertReviews error, falling back to memory store:', err);
    }
  }

  const store = getMemoryStore();
  for (const r of reviews) {
    const cardIndex = store.cards.findIndex((c) => c.id === r.card_id);
    if (cardIndex !== -1) {
      store.cards[cardIndex] = {
        ...store.cards[cardIndex],
        repetition: r.repetition,
        interval: r.interval,
        ease_factor: r.ease_factor,
        due_date: r.due_date,
        last_reviewed: r.reviewed_at,
        status: r.status,
        stability: r.stability,
        difficulty: r.difficulty,
        lapses: r.lapses,
        state: r.state,
      };
      store.reviewLogs.push({
        id: store.reviewLogs.length + 1,
        card_id: r.card_id,
        rating: r.rating,
        reviewed_at: r.reviewed_at,
        interval: r.interval,
        ease_factor: r.ease_factor,
        stability: r.stability,
        difficulty: r.difficulty,
      });
    }
  }
}

export function findAllReviewLogs(): ReviewLog[] {
  const db = getDatabase();
  if (db) {
    try {
      return toPlain(db.prepare('SELECT * FROM review_logs ORDER BY id ASC').all() as unknown as ReviewLog[]);
    } catch (err) {
      console.warn('SQLite findAllReviewLogs error, falling back to memory store:', err);
    }
  }
  return toPlain(getMemoryStore().reviewLogs);
}

export function importCardsAndLogs(
  idByKey: Map<string, number>,
  cards: BackupCardProgress[],
  reviewLogs: BackupReviewLog[]
): { cards: number; review_logs: number; skipped_cards: number } {
  const result = { cards: 0, review_logs: 0, skipped_cards: 0 };
  const db = getDatabase();

  if (db) {
    try {
      db.exec('BEGIN');
      const updateCard = db.prepare(`
        UPDATE cards SET repetition = ?, interval = ?, ease_factor = ?, due_date = ?, last_reviewed = ?, status = ?,
                         stability = ?, difficulty = ?, lapses = ?, state = ?
        WHERE id = ?
      `);
      for (const c of cards) {
        const id = idByKey.get(c.key);
        if (!id) {
          result.skipped_cards += 1;
          continue;
        }
        updateCard.run(
          c.repetition,
          c.interval,
          c.ease_factor,
          c.due_date,
          c.last_reviewed,
          c.status,
          c.stability ?? 0,
          c.difficulty ?? 0,
          c.lapses ?? 0,
          c.state ?? 0,
          id
        );
        result.cards += 1;
      }

      const existsLog = db.prepare('SELECT 1 FROM review_logs WHERE card_id = ? AND reviewed_at = ?');
      const insertLog = db.prepare(
        'INSERT INTO review_logs (card_id, rating, reviewed_at, interval, ease_factor, stability, difficulty) VALUES (?, ?, ?, ?, ?, ?, ?)'
      );
      for (const l of reviewLogs || []) {
        const id = idByKey.get(l.card_key);
        if (!id || existsLog.get(id, l.reviewed_at)) continue;
        insertLog.run(id, l.rating, l.reviewed_at, l.interval, l.ease_factor, l.stability ?? 0, l.difficulty ?? 0);
        result.review_logs += 1;
      }
      db.exec('COMMIT');
      return result;
    } catch (err) {
      try { db.exec('ROLLBACK'); } catch {}
      throw err;
    }
  }

  const store = getMemoryStore();
  for (const c of cards) {
    const idx = store.cards.findIndex((x) => makeCardKey(x) === c.key);
    if (idx === -1) {
      result.skipped_cards += 1;
      continue;
    }
    store.cards[idx] = { ...store.cards[idx], ...c, id: store.cards[idx].id } as Card;
    result.cards += 1;
  }
  for (const l of reviewLogs || []) {
    const id = idByKey.get(l.card_key);
    if (!id || store.reviewLogs.some((x) => x.card_id === id && x.reviewed_at === l.reviewed_at)) continue;
    store.reviewLogs.push({
      id: store.reviewLogs.length + 1,
      card_id: id,
      rating: l.rating,
      reviewed_at: l.reviewed_at,
      interval: l.interval,
      ease_factor: l.ease_factor,
      stability: l.stability,
      difficulty: l.difficulty,
    });
    result.review_logs += 1;
  }

  return result;
}

