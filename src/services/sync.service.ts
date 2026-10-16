import { Card, LocalReviewQueueItem, makeCardKey } from '@/models';
import { getLocalDb } from '@/repositories/local/indexeddb.repository';

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let periodicTimer: ReturnType<typeof setInterval> | null = null;
let isSyncing = false;

/**
 * Enqueue a card review into local Dexie IndexedDB.
 * Updates local card progress immediately (0ms) and schedules a background sync.
 */
export async function enqueueReview(
  item: LocalReviewQueueItem,
  onStatsUpdate?: (stats: any) => void
): Promise<void> {
  const db = getLocalDb();
  if (!db) return;

  try {
    await db.transaction('rw', db.sync_queue, db.card_progress, async () => {
      await db.sync_queue.add(item);
      await db.card_progress.put({
        card_key: item.card_key,
        card_id: item.card_id,
        repetition: item.repetition,
        interval: item.interval,
        ease_factor: item.ease_factor,
        due_date: item.due_date,
        last_reviewed: item.reviewed_at,
        status: item.status,
        stability: item.stability,
        difficulty: item.difficulty,
        updated_at: new Date().toISOString(),
      });
    });

    const count = await db.sync_queue.count();

    if (count >= 5) {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
      }
      flushSyncQueue().then((res) => {
        if (res.stats && onStatsUpdate) onStatsUpdate(res.stats);
      });
      return;
    }

    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      flushSyncQueue().then((res) => {
        if (res.stats && onStatsUpdate) onStatsUpdate(res.stats);
      });
    }, 8000);
  } catch (err) {
    console.error('Error enqueuing review in Dexie:', err);
  }
}

/**
 * Flush all pending reviews from Dexie sync queue to Supabase & Server.
 * Supports exit sync via keepalive: true or sendBeacon.
 */
export async function flushSyncQueue(options?: {
  keepalive?: boolean;
}): Promise<{ success: boolean; synced: number; stats?: any }> {
  const db = getLocalDb();
  if (!db) return { success: false, synced: 0 };

  if (isSyncing && !options?.keepalive) {
    return { success: false, synced: 0 };
  }

  try {
    isSyncing = true;
    const items = await db.sync_queue.toArray();
    if (!items || items.length === 0) {
      isSyncing = false;
      return { success: true, synced: 0 };
    }

    const ids = items.map((i) => i.id!).filter((id): id is number => typeof id === 'number');
    const payload = JSON.stringify({
      reviews: items,
      tz: new Date().getTimezoneOffset(),
    });

    const isExit = !!options?.keepalive;

    if (
      isExit &&
      typeof navigator !== 'undefined' &&
      typeof navigator.sendBeacon === 'function' &&
      payload.length < 60000
    ) {
      const blob = new Blob([payload], { type: 'application/json' });
      const queued = navigator.sendBeacon('/api/sync', blob);
      if (queued) {
        await db.sync_queue.bulkDelete(ids);
        isSyncing = false;
        return { success: true, synced: ids.length };
      }
    }

    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: isExit,
    });

    if (res.ok) {
      const data = await res.json().catch(() => null);
      await db.sync_queue.bulkDelete(ids);
      isSyncing = false;
      return { success: true, synced: ids.length, stats: data?.stats };
    } else {
      console.warn('Sync failed with status:', res.status);
    }
  } catch (err) {
    console.warn('Sync error (items preserved in Dexie for next sync):', err);
  } finally {
    isSyncing = false;
  }

  return { success: false, synced: 0 };
}

/**
 * Seed or refresh cards in Dexie from initial load.
 */
export async function cacheCardsInLocalDb(cards: Card[]): Promise<void> {
  const db = getLocalDb();
  if (!db || !cards || cards.length === 0) return;

  try {
    const records = cards.map((c) => ({
      card_key: makeCardKey(c),
      card_id: c.id,
      repetition: c.repetition,
      interval: c.interval,
      ease_factor: c.ease_factor,
      due_date: c.due_date,
      last_reviewed: c.last_reviewed,
      status: c.status,
      stability: c.stability,
      difficulty: c.difficulty,
      updated_at: new Date().toISOString(),
    }));
    await db.card_progress.bulkPut(records);
  } catch (err) {
    console.warn('Could not cache cards in Dexie:', err);
  }
}

/**
 * Initialize sync listeners:
 * 1. Startup flush (catches up on any leftover items from prior sessions).
 * 2. Exit synchronization (visibilitychange & pagehide with keepalive).
 * 3. Network online listener.
 * 4. Periodic background sync every 30 seconds.
 */
export function initSyncListeners(onStatsUpdate?: (stats: any) => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  flushSyncQueue().then((res) => {
    if (res.stats && onStatsUpdate) onStatsUpdate(res.stats);
  });

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      flushSyncQueue({ keepalive: true });
    }
  };

  const handlePageHide = () => {
    flushSyncQueue({ keepalive: true });
  };

  const handleBeforeUnload = () => {
    flushSyncQueue({ keepalive: true });
  };

  const handleOnline = () => {
    flushSyncQueue().then((res) => {
      if (res.stats && onStatsUpdate) onStatsUpdate(res.stats);
    });
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('pagehide', handlePageHide);
  window.addEventListener('beforeunload', handleBeforeUnload);
  window.addEventListener('online', handleOnline);

  if (periodicTimer) clearInterval(periodicTimer);
  periodicTimer = setInterval(() => {
    const db = getLocalDb();
    if (!db) return;
    db.sync_queue.count().then((count) => {
      if (count > 0) {
        flushSyncQueue().then((res) => {
          if (res.stats && onStatsUpdate) onStatsUpdate(res.stats);
        });
      }
    });
  }, 30000);

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('pagehide', handlePageHide);
    window.removeEventListener('beforeunload', handleBeforeUnload);
    window.removeEventListener('online', handleOnline);
    if (periodicTimer) {
      clearInterval(periodicTimer);
      periodicTimer = null;
    }
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
  };
}

