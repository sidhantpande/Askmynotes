-- Enable UUID generation.
create extension if not exists "pgcrypto";

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  color text,
  created_at timestamptz not null default now()
);

create unique index if not exists subjects_user_title_key
  on public.subjects (user_id, lower(title));

create table if not exists public.chats (
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_title text not null,
  messages jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, subject_title)
);

alter table public.subjects enable row level security;
alter table public.chats enable row level security;

create policy "Subjects are readable by owner"
on public.subjects
for select
to authenticated
using (auth.uid() = user_id);

create policy "Subjects are insertable by owner"
on public.subjects
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Subjects are updatable by owner"
on public.subjects
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Subjects are deletable by owner"
on public.subjects
for delete
to authenticated
using (auth.uid() = user_id);

create policy "Chats are readable by owner"
on public.chats
for select
to authenticated
using (auth.uid() = user_id);

create policy "Chats are insertable by owner"
on public.chats
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Chats are updatable by owner"
on public.chats
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Chats are deletable by owner"
on public.chats
for delete
to authenticated
using (auth.uid() = user_id);
