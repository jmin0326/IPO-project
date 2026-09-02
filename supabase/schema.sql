-- Supabase SQL Editor에서 실행하세요.

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.items enable row level security;

create policy "Allow anon read" on public.items
  for select using (true);

create policy "Allow anon insert" on public.items
  for insert with check (true);
