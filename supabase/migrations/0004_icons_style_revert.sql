-- Revert theme column back to style (flat/outline/duotone)
alter table public.icons add column if not exists style text not null default 'outline'
  check (style in ('flat', 'outline', 'duotone'));

-- Drop theme column
alter table public.icons drop column if exists theme;
