import { BackupLifeProgress, LifeQuestion } from '@/models';
import { getDatabase, getMemoryStore, toPlain } from './connection';

export function findAllLifeQuestions(): LifeQuestion[] {
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
      console.warn('SQLite findAllLifeQuestions error, falling back to memory store:', err);
    }
  }

  const store = getMemoryStore();
  return toPlain(store.lifeQuestions);
}

export function markLifeQuestionCompleted(questionId: number): boolean {
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
      console.warn('SQLite markLifeQuestionCompleted error, falling back to memory store:', err);
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

export function importLifeQuestions(questions: BackupLifeProgress[]): number {
  let count = 0;
  const db = getDatabase();
  if (db) {
    const updateQ = db.prepare('UPDATE life_questions SET completed = ?, last_practiced = ? WHERE id = ?');
    for (const q of questions || []) {
      updateQ.run(q.completed ? 1 : 0, q.last_practiced, q.id);
      count += 1;
    }
    return count;
  }

  const store = getMemoryStore();
  for (const q of questions || []) {
    const item = store.lifeQuestions.find((x) => x.id === q.id);
    if (item) {
      item.completed = q.completed;
      item.last_practiced = q.last_practiced;
      count += 1;
    }
  }
  return count;
}

