import path from 'path';
import fs from 'fs';
import {
  BACKUP_FORMAT,
  BACKUP_VERSION,
  ImportResult,
  ProgressBackup,
  makeCardKey,
} from '@/models';
import {
  findAllCards,
  findAllReviewLogs,
  importCardsAndLogs,
} from '@/repositories/sqlite/card.repository';
import {
  findAllLifeQuestions,
  importLifeQuestions,
} from '@/repositories/sqlite/life-question.repository';
import {
  findUserSettings,
  saveUserSettings,
} from '@/repositories/sqlite/settings.repository';
import { resetSqliteAndMemory } from '@/repositories/sqlite/connection';
import { deleteSupabaseUserProgress } from '@/repositories/supabase/progress.repository';

/** Snapshot of everything the learner has produced (never the static seed content). */
export function exportProgress(): ProgressBackup {
  const cards = findAllCards();
  const keyById = new Map<number, string>(cards.map((c) => [c.id, makeCardKey(c)]));

  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exported_at: new Date().toISOString(),
    settings: findUserSettings(),
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
    review_logs: findAllReviewLogs()
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
    life_questions: findAllLifeQuestions()
      .filter((q) => q.completed || q.last_practiced)
      .map((q) => ({ id: q.id, completed: q.completed, last_practiced: q.last_practiced })),
  };
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

  const cards = findAllCards();
  const idByKey = new Map<string, number>(cards.map((c) => [makeCardKey(c), c.id]));

  const cardAndLogResult = importCardsAndLogs(idByKey, backup.cards, backup.review_logs || []);
  const lifeQuestionsCount = importLifeQuestions(backup.life_questions || []);

  if (backup.settings) {
    saveUserSettings(backup.settings);
  }

  return {
    cards: cardAndLogResult.cards,
    review_logs: cardAndLogResult.review_logs,
    life_questions: lifeQuestionsCount,
    skipped_cards: cardAndLogResult.skipped_cards,
  };
}

export function resetDatabase() {
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

  resetSqliteAndMemory();
}

export async function resetUserOrLocalProgress(): Promise<{ message: string }> {
  const deletedInSupabase = await deleteSupabaseUserProgress();
  if (deletedInSupabase) {
    return {
      message: 'Đã khôi phục tiến độ học của tài khoản về ban đầu.',
    };
  }

  resetDatabase();
  return {
    message: 'Database reset and re-seeded successfully',
  };
}

