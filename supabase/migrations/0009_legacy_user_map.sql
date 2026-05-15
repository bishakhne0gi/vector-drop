-- 0009_legacy_user_map.sql
-- One-time table for the Clerk dev→prod cutover. Drop after T+30 days.
create table if not exists legacy_user_map (
  email          text primary key,
  dev_clerk_id   text not null,
  display_name   text,
  remapped_at    timestamptz,
  prod_clerk_id  text
);

create index if not exists legacy_user_map_dev_id_idx
  on legacy_user_map (dev_clerk_id);

alter table legacy_user_map enable row level security;
-- No policies: service-role only. Authenticated users cannot read.
