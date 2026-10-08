-- Supabase schema for chinese-flashcard learner progress.
-- Static content (cards, char details, life-question text) stays in the app code;
-- only what the learner produces is stored. Rows are keyed by the stable
-- `card_key` ("hanzi|pinyin") used by the backup format (see src/lib/db.ts).
--
-- Run in the Supabase SQL editor, then use scripts/migrate-to-supabase.mjs.

create table if not exists public.card_progress (
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  card_key       text not null,
  repetition     integer not null default 0,
  interval       integer not null default 0,           -- days
  ease_factor    real    not null default 2.5,
  due_date       timestamptz not null,
  last_reviewed  timestamptz,
  status         text not null default 'new'
                 check (status in ('new', 'learning', 'reviewing', 'mastered')),
  updated_at     timestamptz not null default now(),
  primary key (user_id, card_key)
);

create table if not exists public.review_logs (
  id           bigint generated always as identity primary key,
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  card_key     text not null,
  rating       smallint not null check (rating between 1 and 4),
  reviewed_at  timestamptz not null,
  interval     integer not null,
  ease_factor  real not null,
  -- makes re-running the migration idempotent
  unique (user_id, card_key, reviewed_at)
);
create index if not exists review_logs_user_day_idx on public.review_logs (user_id, reviewed_at desc);

create table if not exists public.life_question_progress (
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  question_id     integer not null,
  completed       boolean not null default false,
  last_practiced  timestamptz,
  primary key (user_id, question_id)
);

create table if not exists public.user_settings (
  user_id   uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  settings  jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Row Level Security: each user only sees their own rows.
alter table public.card_progress          enable row level security;
alter table public.review_logs            enable row level security;
alter table public.life_question_progress enable row level security;
alter table public.user_settings          enable row level security;

do $$
declare t text;
begin
  foreach t in array array['card_progress', 'review_logs', 'life_question_progress', 'user_settings']
  loop
    execute format('drop policy if exists "own rows" on public.%I', t);
    execute format(
      'create policy "own rows" on public.%I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())',
      t
    );
  end loop;
end $$;

