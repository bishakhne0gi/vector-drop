-- 0010_project_frames.sql
alter table projects add column if not exists kind text not null default 'image';

create table if not exists project_frames (
  project_id   uuid not null references projects(id) on delete cascade,
  frame_idx    int  not null,
  svg_url      text not null,
  duration_ms  int  not null,
  primary key (project_id, frame_idx)
);
create index if not exists project_frames_project_idx
  on project_frames (project_id, frame_idx);

alter table project_frames enable row level security;
-- No policies: service-role only. Reads go through API routes that enforce ownership.
