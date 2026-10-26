-- Golee · fase 1 · esquema inicial para Supabase (Postgres + RLS)
-- O app hoje roda só local (localStorage). Este esquema é o alvo da camada de servidor.
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null,
  character text not null default 'gota',
  goal_ml int not null default 2000,
  glass_ml int not null default 250,
  awake_start int not null default 8,
  awake_end int not null default 20,
  tz text not null default 'America/Sao_Paulo',
  objective text not null default 'saude',
  created_at timestamptz default now()
);
create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  emoji text not null default '💧',
  scene text not null default 'Nascente',
  mode text not null default 'percentual' check (mode in ('percentual','litros')),
  collective_goal_ml int,
  owner_id uuid references profiles(id),
  anyone_invites boolean default true,
  pokes_mode text default 'ligados',
  rest_day boolean default true,
  max_members int default 12,
  created_at timestamptz default now()
);
create table if not exists memberships (
  group_id uuid references groups(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (group_id, user_id)
);
create table if not exists goles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  ts timestamptz not null default now(),
  ml int not null,
  kind text not null default 'gole',
  points int not null default 0,
  flags text[] default '{}',
  day date generated always as ((ts at time zone 'America/Sao_Paulo')::date) stored
);
create index if not exists goles_user_day on goles(user_id, day);
create table if not exists pokes (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups(id) on delete cascade,
  from_user uuid references profiles(id),
  to_user uuid references profiles(id),
  ts timestamptz default now()
);
create table if not exists push_subscriptions (
  user_id uuid references profiles(id) on delete cascade,
  endpoint text primary key,
  keys jsonb not null,
  created_at timestamptz default now()
);

-- Ranking diário por grupo (percentual da meta + bônus)
create or replace view daily_ranking as
select m.group_id, g.day, p.id as user_id, p.name, p.character,
       coalesce(sum(g.ml),0) as ml, p.goal_ml,
       round(least(1.5, coalesce(sum(g.ml),0)::numeric / nullif(p.goal_ml,0)) * 100, 1) + coalesce(sum(g.points),0) / 10.0 as score
from memberships m
join profiles p on p.id = m.user_id
left join goles g on g.user_id = p.id
group by m.group_id, g.day, p.id;

alter table profiles enable row level security;
alter table groups enable row level security;
alter table memberships enable row level security;
alter table goles enable row level security;
alter table pokes enable row level security;
alter table push_subscriptions enable row level security;

create policy "own profile" on profiles for all using (auth.uid() = id);
create policy "read profiles of my groups" on profiles for select using (
  exists (select 1 from memberships a join memberships b on a.group_id = b.group_id where a.user_id = auth.uid() and b.user_id = profiles.id));
create policy "members read groups" on groups for select using (exists (select 1 from memberships where group_id = groups.id and user_id = auth.uid()));
create policy "owner updates group" on groups for update using (owner_id = auth.uid());
create policy "anyone creates group" on groups for insert with check (owner_id = auth.uid());
create policy "see my memberships" on memberships for select using (
  exists (select 1 from memberships x where x.group_id = memberships.group_id and x.user_id = auth.uid()));
create policy "join group" on memberships for insert with check (user_id = auth.uid());
create policy "leave group" on memberships for delete using (user_id = auth.uid());
create policy "own goles" on goles for all using (user_id = auth.uid());
create policy "read goles of my groups" on goles for select using (
  exists (select 1 from memberships a join memberships b on a.group_id = b.group_id where a.user_id = auth.uid() and b.user_id = goles.user_id));
create policy "pokes in my groups" on pokes for all using (from_user = auth.uid() or to_user = auth.uid());
create policy "own push" on push_subscriptions for all using (user_id = auth.uid());
