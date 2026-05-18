create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  code text not null,
  title text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, code)
);

create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  module_id uuid not null references public.modules(id) on delete cascade,
  chapter_number integer not null,
  title text not null,
  description text,
  is_locked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (module_id, chapter_number)
);

create table if not exists public.user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  is_completed boolean not null default false,
  current_progress_percent integer not null default 0,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, chapter_id)
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  due_date date,
  is_done boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  event_date date not null,
  title text not null,
  color text not null default 'vibrant',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists modules_user_id_idx on public.modules(user_id);
create index if not exists chapters_user_id_idx on public.chapters(user_id);
create index if not exists chapters_module_id_idx on public.chapters(module_id);
create index if not exists user_progress_user_id_idx on public.user_progress(user_id);
create index if not exists user_progress_chapter_id_idx on public.user_progress(chapter_id);
create index if not exists goals_user_id_idx on public.goals(user_id);
create index if not exists calendar_events_user_id_idx on public.calendar_events(user_id);
create index if not exists calendar_events_event_date_idx on public.calendar_events(event_date);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_modules_updated_at
before update on public.modules
for each row execute function public.set_updated_at();

create trigger set_chapters_updated_at
before update on public.chapters
for each row execute function public.set_updated_at();

create trigger set_user_progress_updated_at
before update on public.user_progress
for each row execute function public.set_updated_at();

create trigger set_goals_updated_at
before update on public.goals
for each row execute function public.set_updated_at();

create trigger set_calendar_events_updated_at
before update on public.calendar_events
for each row execute function public.set_updated_at();

alter table public.modules enable row level security;
alter table public.chapters enable row level security;
alter table public.user_progress enable row level security;
alter table public.goals enable row level security;
alter table public.calendar_events enable row level security;

create policy "Users can view their own modules"
on public.modules for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can create their own modules"
on public.modules for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own modules"
on public.modules for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own modules"
on public.modules for delete
to authenticated
using (auth.uid() = user_id);

create policy "Users can view their own chapters"
on public.chapters for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can create chapters for their own modules"
on public.chapters for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.modules
    where modules.id = chapters.module_id
      and modules.user_id = auth.uid()
  )
);

create policy "Users can update their own chapters"
on public.chapters for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own chapters"
on public.chapters for delete
to authenticated
using (auth.uid() = user_id);

create policy "Users can view their own progress"
on public.user_progress for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can create their own progress"
on public.user_progress for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.chapters
    where chapters.id = user_progress.chapter_id
      and chapters.user_id = auth.uid()
  )
);

create policy "Users can update their own progress"
on public.user_progress for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own progress"
on public.user_progress for delete
to authenticated
using (auth.uid() = user_id);

create policy "Users can view their own goals"
on public.goals for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can create their own goals"
on public.goals for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own goals"
on public.goals for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own goals"
on public.goals for delete
to authenticated
using (auth.uid() = user_id);

create policy "Users can view their own calendar events"
on public.calendar_events for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can create their own calendar events"
on public.calendar_events for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own calendar events"
on public.calendar_events for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own calendar events"
on public.calendar_events for delete
to authenticated
using (auth.uid() = user_id);