-- Allow guest projects: user_id is nullable so unauthenticated users can
-- convert images before signing in. Projects are claimed (user_id assigned)
-- via POST /api/projects/claim after login.
alter table projects
  alter column user_id drop not null,
  alter column user_id drop default;

-- Drop the old foreign key constraint and re-add as nullable
alter table projects
  drop constraint if exists projects_user_id_fkey;

alter table projects
  add constraint projects_user_id_fkey
    foreign key (user_id) references profiles(id) on delete cascade;

-- Index on null user_id for guest project cleanup jobs
create index if not exists projects_guest_idx on projects(id) where user_id is null;
