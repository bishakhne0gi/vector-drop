alter table public.icons add column if not exists theme text not null default 'lucide'
  check (theme in ('lucide', 'neobrutalism', 'glassmorphism'));

-- Drop old style column if it exists
alter table public.icons drop column if exists style;
