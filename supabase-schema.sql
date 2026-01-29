-- 在 Supabase SQL 编辑器中执行以下脚本来创建表结构

-- 用户表使用 Supabase 自带 auth.users，这里不再重复定义。

-- 复盘主表
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  title text,
  market_summary text,
  my_trades text,
  reflection text,
  plan text,
  tags text[] default '{}'::text[],
  return_pct real,
  return_value real,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists reviews_user_date_idx
  on public.reviews (user_id, date desc, created_at desc);

-- 图片表
create table if not exists public.review_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  review_id uuid not null references public.reviews (id) on delete cascade,
  path text not null,
  url text not null,
  "desc" text,
  created_at timestamptz default now()
);

create index if not exists review_photos_user_review_idx
  on public.review_photos (user_id, review_id, created_at desc);

-- RLS 策略：每个用户只能访问自己的数据
alter table public.reviews enable row level security;
alter table public.review_photos enable row level security;

-- reviews 策略
create policy "用户只能查看自己的复盘"
  on public.reviews
  for select
  using (auth.uid() = user_id);

create policy "用户只能插入自己的复盘"
  on public.reviews
  for insert
  with check (auth.uid() = user_id);

create policy "用户只能更新自己的复盘"
  on public.reviews
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "用户只能删除自己的复盘"
  on public.reviews
  for delete
  using (auth.uid() = user_id);

-- review_photos 策略
create policy "用户只能查看自己的图片"
  on public.review_photos
  for select
  using (auth.uid() = user_id);

create policy "用户只能插入自己的图片"
  on public.review_photos
  for insert
  with check (auth.uid() = user_id);

create policy "用户只能更新自己的图片"
  on public.review_photos
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "用户只能删除自己的图片"
  on public.review_photos
  for delete
  using (auth.uid() = user_id);

-- 若已创建过 reviews 表，可单独执行以下语句新增收益字段：
-- alter table public.reviews add column if not exists return_pct real;
-- alter table public.reviews add column if not exists return_value real;