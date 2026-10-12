-- ========================================================
-- BlockArena Database & Supabase Realtime Setup
-- ========================================================

-- 1. Table: Solo High Scores (Leaderboard Global)
-- Catatan: Hanya mencatat skor tertinggi permainan SOLO (Bukan akumulasi & Bukan dari room)
create table if not exists public.leaderboard (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  score integer not null, -- Skor tertinggi per match solo
  lines_cleared integer default 0,
  max_combo integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_leaderboard_score on public.leaderboard (score desc);

-- 2. Table: Rooms (Stage Multiplayer)
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  is_private boolean default false,
  password text, -- Disimpan jika private
  status text default 'waiting', -- 'waiting', 'playing', 'finished'
  max_players integer default 5,
  host_id text not null,
  host_name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_rooms_code on public.rooms (code);
create index if not exists idx_rooms_status on public.rooms (status);

-- 3. Row Level Security (RLS) - Permissive for Guest/Anonymous
alter table public.leaderboard enable row level security;
alter table public.rooms enable row level security;

-- Leaderboard policies
create policy "Allow public read leaderboard"
  on public.leaderboard for select
  using (true);

create policy "Allow public insert leaderboard"
  on public.leaderboard for insert
  with check (true);

create policy "Allow public update leaderboard"
  on public.leaderboard for update
  using (true);

create policy "Allow public delete leaderboard"
  on public.leaderboard for delete
  using (true);

-- Rooms policies
create policy "Allow public read rooms"
  on public.rooms for select
  using (true);

create policy "Allow public insert rooms"
  on public.rooms for insert
  with check (true);

create policy "Allow public update rooms"
  on public.rooms for update
  using (true);

create policy "Allow public delete rooms"
  on public.rooms for delete
  using (true);

-- 4. Supabase Realtime
-- Aktifkan Realtime untuk channel broadcast & presence (stage:*).
-- Di Supabase Dashboard, pastikan Realtime diaktifkan di Database -> Replication.
