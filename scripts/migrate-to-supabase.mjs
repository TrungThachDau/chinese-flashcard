#!/usr/bin/env node
/**
 * Push a progress backup (from GET /api/export) into Supabase. Idempotent:
 * safe to re-run, rows are upserted on their natural keys.
 *
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=... \
 *   SUPABASE_USER_ID=<uuid of your auth user> \
 *   node scripts/migrate-to-supabase.mjs flashcard-progress-2026-10-08.json [--dry-run]
 *
 * Uses plain fetch against PostgREST, so no extra dependency is required.
 * Keep the service-role key out of the browser and out of git.
 */
import fs from 'node:fs';

const [file, ...flags] = process.argv.slice(2);
const dryRun = flags.includes('--dry-run');
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_USER_ID } = process.env;

if (!file) {
  console.error('Usage: node scripts/migrate-to-supabase.mjs <backup.json> [--dry-run]');
  process.exit(1);
}
if (!dryRun && (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_USER_ID)) {
  console.error('Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY or SUPABASE_USER_ID');
  process.exit(1);
}

const backup = JSON.parse(fs.readFileSync(file, 'utf8'));
if (backup.format !== 'chinese-flashcard-backup') {
  console.error('Not a chinese-flashcard backup file');
  process.exit(1);
}

const user_id = SUPABASE_USER_ID;

const tables = [
  {
    table: 'card_progress',
    conflict: 'user_id,card_key',
    rows: backup.cards.map((c) => ({
      user_id,
      card_key: c.key,
      repetition: c.repetition,
      interval: c.interval,
      ease_factor: c.ease_factor,
      due_date: c.due_date,
      last_reviewed: c.last_reviewed,
      status: c.status,
    })),
  },
  {
    table: 'review_logs',
    conflict: 'user_id,card_key,reviewed_at',
    rows: backup.review_logs.map((l) => ({
      user_id,
      card_key: l.card_key,
      rating: l.rating,
      reviewed_at: l.reviewed_at,
      interval: l.interval,
      ease_factor: l.ease_factor,
    })),
  },
  {
    table: 'life_question_progress',
    conflict: 'user_id,question_id',
    rows: backup.life_questions.map((q) => ({
      user_id,
      question_id: q.id,
      completed: q.completed,
      last_practiced: q.last_practiced,
    })),
  },
  {
    table: 'user_settings',
    conflict: 'user_id',
    rows: backup.settings ? [{ user_id, settings: backup.settings }] : [],
  },
];

const CHUNK = 500;

for (const { table, conflict, rows } of tables) {
  console.log(`${table}: ${rows.length} rows${dryRun ? ' (dry run)' : ''}`);
  if (dryRun) continue;

  for (let i = 0; i < rows.length; i += CHUNK) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?on_conflict=${conflict}`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(rows.slice(i, i + CHUNK)),
    });
    if (!res.ok) {
      console.error(`  ${table} chunk @${i} failed: ${res.status} ${await res.text()}`);
      process.exit(1);
    }
  }
}

console.log(dryRun ? 'Dry run complete. Nothing was written.' : 'Migration complete.');

