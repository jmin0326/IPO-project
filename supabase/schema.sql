-- 구독 습관 진단기 — 테이블 설계 (차시 6)
--
-- 쓰는 법: Supabase 대시보드 > SQL Editor > New query 에 이 파일을 통째로
--          붙여넣고 Run 을 누르면 된다. 위에서부터 차례로 실행된다.
--
-- ---------------------------------------------------------------------------
-- 설계에서 가장 중요한 점 — 매칭 테이블
-- ---------------------------------------------------------------------------
-- 사용자와 서비스는 다대다 관계다.
--   한 사람이 여러 서비스를 구독하고, 한 서비스를 여러 사람이 구독한다.
-- 이걸 표 두 개로는 표현할 수 없다. 그래서 사이에 subscriptions 를 둔다.
--
--   profiles(사람)  ──┐
--                     ├── subscriptions(매칭) ── service_id (코드에 있는 서비스 목록)
--                     │        ├── usage_logs      (언제 몇 분 썼나)
--                     │        └── monthly_counts  (월 단위 몰아 입력)
--
-- subscriptions 한 줄 = "이 사람이 이 서비스를, 이 요금제로, 이 금액에 쓰고 있다"
--
-- ---------------------------------------------------------------------------
-- 왜 service_id 가 외래키가 아니라 그냥 text 인가
-- ---------------------------------------------------------------------------
-- 서비스 목록(넷플릭스·티빙·요금제들)은 아직 코드(src/data/services.ts)에 있다.
-- 다음 단계에서 services 테이블로 옮기면 그때 외래키로 바꾼다.
-- 지금 미리 테이블을 만들어 두면 코드와 DB 두 곳을 같이 고쳐야 해서 더 헷갈린다.


-- ===========================================================================
-- 1. 프로필 — 닉네임과 연령대
-- ===========================================================================
-- 로그인 정보(이메일·비밀번호)는 Supabase 가 auth.users 에 알아서 저장한다.
-- 우리가 따로 받는 닉네임·연령대만 여기에 둔다.
-- id 를 auth.users 의 id 와 똑같이 맞춰서 1:1로 붙인다.

create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  nickname    text not null,
  age_group   text,
  created_at  timestamptz not null default now()
);


-- ===========================================================================
-- 2. 구독 — 사용자와 서비스를 잇는 매칭 테이블
-- ===========================================================================

create table if not exists public.subscriptions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  -- src/data/services.ts 의 Service.id (예: 'netflix')
  service_id     text not null,
  -- 그 서비스 안의 Plan.id (예: 'netflix-standard')
  plan_id        text not null,
  -- 실제로 내는 금액. 할인받으면 요금제 정가와 다를 수 있어서 따로 저장한다.
  monthly_price  integer not null check (monthly_price >= 0),
  billing_day    integer not null check (billing_day between 1 and 31),
  created_at     timestamptz not null default now()
);

create index if not exists subscriptions_user_id_idx
  on public.subscriptions (user_id);


-- ===========================================================================
-- 3. 이용 기록 — 언제 몇 분 썼나
-- ===========================================================================
-- 같은 구독을 같은 날 두 번 기록하지 않도록 (subscription_id, used_on) 을 묶어
-- unique 로 막는다. 앱에서도 막고 있지만, 막는 곳이 DB에도 있어야 안전하다.
--
-- user_id 는 subscriptions 를 따라가면 알 수 있는 값이라 사실 중복이다.
-- 그래도 넣은 이유: 아래 보안 규칙(RLS)을 "user_id 가 나와 같은 행만" 이라고
-- 단순하게 쓸 수 있고, 매번 subscriptions 를 뒤지지 않아도 되어 빠르다.

create table if not exists public.usage_logs (
  id               uuid primary key default gen_random_uuid(),
  subscription_id  uuid not null references public.subscriptions (id) on delete cascade,
  user_id          uuid not null references auth.users (id) on delete cascade,
  used_on          date not null,
  minutes          integer not null default 0 check (minutes >= 0),
  created_at       timestamptz not null default now(),
  unique (subscription_id, used_on)
);

create index if not exists usage_logs_user_id_idx on public.usage_logs (user_id);


-- ===========================================================================
-- 4. 월 단위 몰아 입력 — "이번 달 몇 번 쓰셨나요?"
-- ===========================================================================
-- 한 구독의 한 달에 값은 하나만 있어야 하므로 (subscription_id, month) 를 unique.

create table if not exists public.monthly_counts (
  id               uuid primary key default gen_random_uuid(),
  subscription_id  uuid not null references public.subscriptions (id) on delete cascade,
  user_id          uuid not null references auth.users (id) on delete cascade,
  -- 'YYYY-MM'
  month            text not null,
  count            integer not null check (count >= 0),
  created_at       timestamptz not null default now(),
  unique (subscription_id, month)
);

create index if not exists monthly_counts_user_id_idx
  on public.monthly_counts (user_id);


-- ===========================================================================
-- 5. 보안 규칙 (RLS) — 남의 데이터가 안 보이게 막는다
-- ===========================================================================
-- Supabase 키는 브라우저에 그대로 노출된다. 그래서 "앱에서만 조심하면 된다"는
-- 통하지 않는다. 누구든 그 키로 직접 DB에 요청을 보낼 수 있기 때문이다.
--
-- RLS 를 켜면 DB 자체가 "로그인한 사람 본인 행만" 통과시킨다.
-- auth.uid() 는 지금 로그인한 사람의 id 다.

alter table public.profiles       enable row level security;
alter table public.subscriptions  enable row level security;
alter table public.usage_logs     enable row level security;
alter table public.monthly_counts enable row level security;

-- 프로필: 내 것만 보고, 내 것만 만들고, 내 것만 고친다
drop policy if exists "profiles: 내 것만" on public.profiles;
create policy "profiles: 내 것만" on public.profiles
  for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 구독
drop policy if exists "subscriptions: 내 것만" on public.subscriptions;
create policy "subscriptions: 내 것만" on public.subscriptions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 이용 기록
drop policy if exists "usage_logs: 내 것만" on public.usage_logs;
create policy "usage_logs: 내 것만" on public.usage_logs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 월 단위 몰아 입력
drop policy if exists "monthly_counts: 내 것만" on public.monthly_counts;
create policy "monthly_counts: 내 것만" on public.monthly_counts
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ===========================================================================
-- 6. 연결 테스트용으로 만들었던 items 테이블 정리
-- ===========================================================================
-- 차시 6 준비 단계에서 "저장이 되나" 확인하려고 만든 표다. 이제 필요 없다.
-- 지우기 전에 /supabase-test 화면을 먼저 지울 것이므로, 아래 줄은
-- 앱 정리가 끝난 뒤에 따로 실행하면 된다.

-- drop table if exists public.items;
