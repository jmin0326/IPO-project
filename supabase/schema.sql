-- Supabase SQL Editor에서 한 줄씩 실행하세요.
-- (여러 줄을 한 번에 실행하면 실패하는 경우가 있습니다.)

create table items (id serial primary key, content text);

alter table items add column created_at timestamptz default now();

create policy "anon read" on items for select using (true);

create policy "anon insert" on items for insert with check (true);
