import { CharDetail } from '@/models';
import { INITIAL_CHAR_DETAILS } from '@/models/data/initialData';
import { getDatabase, getMemoryStore, toPlain } from './connection';

export function findCharDetail(char: string): CharDetail | null {
  const db = getDatabase();
  if (db) {
    try {
      const row = db.prepare('SELECT * FROM char_details WHERE char = ?').get(char);
      if (row) return toPlain(row as unknown as CharDetail);
    } catch (err) {
      console.warn('SQLite findCharDetail error, falling back to memory store:', err);
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

export function findAllCharDetails(): Record<string, CharDetail> {
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
      console.warn('SQLite findAllCharDetails error, falling back to memory store:', err);
    }
  }

  const store = getMemoryStore();
  const map: Record<string, CharDetail> = { ...INITIAL_CHAR_DETAILS };
  for (const [k, v] of store.charDetails.entries()) {
    map[k] = v;
  }
  return toPlain(map);
}

