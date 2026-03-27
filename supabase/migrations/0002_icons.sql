-- Icons library table
create table if not exists public.icons (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  prompt       text not null default '',
  description  text not null default '',
  style        text not null check (style in ('flat', 'outline', 'duotone')),
  primary_color text not null,
  svg_content  text not null,
  path_count   int not null default 0,
  is_public    boolean not null default true,
  tags         text[] not null default '{}',
  download_count int not null default 0,
  created_at   timestamptz not null default now()
);

-- Full-text search index on prompt + description
create index if not exists icons_fts_idx
  on public.icons
  using gin(to_tsvector('english', coalesce(prompt, '') || ' ' || coalesce(description, '')));

-- Fast lookup: user's icons newest-first
create index if not exists icons_user_created_idx
  on public.icons(user_id, created_at desc);

-- Fast lookup: public icons newest-first
create index if not exists icons_public_created_idx
  on public.icons(is_public, created_at desc)
  where is_public = true;

-- RLS
alter table public.icons enable row level security;

create policy "Public icons viewable by everyone"
  on public.icons for select
  using (is_public = true);

create policy "Users can view own icons"
  on public.icons for select
  using (auth.uid() = user_id);

create policy "Users can insert own icons"
  on public.icons for insert
  with check (auth.uid() = user_id);

create policy "Users can update own icons"
  on public.icons for update
  using (auth.uid() = user_id);

create policy "Users can delete own icons"
  on public.icons for delete
  using (auth.uid() = user_id);
