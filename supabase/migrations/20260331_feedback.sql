create table if not exists feedback (
  id          uuid primary key default gen_random_uuid(),
  user_id     text,           -- null for guests
  page        text not null,  -- 'dashboard' | 'editor' | 'landing'
  rating      smallint check (rating between 1 and 5),
  message     text,
  created_at  timestamptz not null default now()
);
