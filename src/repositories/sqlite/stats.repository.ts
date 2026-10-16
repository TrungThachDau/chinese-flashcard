import { CategoryInfo, StudyStats } from '@/models';
import { CATEGORIES_CONFIG } from '@/models/data/initialData';
import { getDatabase, getMemoryStore, toPlain } from './connection';

/**
 * Day boundaries are computed in the *learner's* timezone, not UTC, so that
 * "today's reviews" and the streak roll over at local midnight.
 * `tzOffsetMinutes` follows `Date.prototype.getTimezoneOffset()` (UTC+7 -> -420).
 */
export function getLocalDayInfo(tzOffsetMinutes: number, nowDate: Date = new Date()) {
  const offsetMs = -tzOffsetMinutes * 60_000;
  const DAY = 86_400_000;
  const startMs = Math.floor((nowDate.getTime() + offsetMs) / DAY) * DAY - offsetMs;
  return {
    startIso: new Date(startMs).toISOString(),
    endIso: new Date(startMs + DAY).toISOString(),
    todayKey: new Date(nowDate.getTime() + offsetMs).toISOString().substring(0, 10),
    sqlModifier: `${-tzOffsetMinutes >= 0 ? '+' : '-'}${Math.abs(tzOffsetMinutes)} minutes`,
    offsetMs,
  };
}

/** Consecutive local days with at least one review, ending today (or yesterday). */
export function computeStreak(days: Iterable<string>, todayKey: string): number {
  const set = new Set(days);
  const DAY = 86_400_000;
  let cursor = Date.parse(`${todayKey}T00:00:00Z`);
  if (!set.has(todayKey)) cursor -= DAY;
  let streak = 0;
  while (set.has(new Date(cursor).toISOString().substring(0, 10))) {
    streak += 1;
    cursor -= DAY;
  }
  return streak;
}

export function computeSqliteStudyStats(tzOffsetMinutes: number = new Date().getTimezoneOffset()): StudyStats {
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
      const retentionRate =
        totalReviewsRow.count > 0
          ? Math.round((successReviewsRow.count / totalReviewsRow.count) * 100)
          : 100;

      const streakRows = db
        .prepare(`
          SELECT DISTINCT date(reviewed_at, ?) as review_day
          FROM review_logs
          ORDER BY review_day DESC
          LIMIT 400
        `)
        .all(day.sqlModifier) as Array<{ review_day: string }>;
      const streakDays = computeStreak(
        streakRows.map((r) => r.review_day),
        day.todayKey
      );

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

      return toPlain({
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
      });
    } catch (err) {
      console.warn('SQLite computeSqliteStudyStats error, falling back to memory store:', err);
    }
  }

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

