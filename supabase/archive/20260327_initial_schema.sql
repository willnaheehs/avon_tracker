-- =========================================================
-- CLEAN RESTART: multi-team roster + interactions
-- Coaches create MANY teams
-- Players join by TEAM invite code
-- =========================================================

create extension if not exists pgcrypto;

-- ---------- Drop views first ----------
drop view if exists public.my_roster cascade;

-- ---------- Drop tables ----------
drop table if exists public.interactions cascade;
drop table if exists public.teams cascade;
drop table if exists public.coaches cascade;
drop table if exists public.profiles cascade;

-- Legacy table you said you want to retire
drop table if exists public.players cascade;

-- ---------- Drop functions/triggers we (re)create ----------
drop function if exists public.subject_on_my_roster(uuid) cascade;
drop function if exists public.profiles_enforce_roles() cascade;
drop function if exists public.interactions_enforce_subject_is_player() cascade;
drop function if exists public.interactions_set_actor() cascade;
drop function if exists public.interactions_enforce_immutable_fields() cascade;
drop function if exists public.register_coach(text, text) cascade;
drop function if exists public.register_player(text, int, text) cascade;
drop function if exists public.create_team(text) cascade;
drop function if exists public.generate_invite_code() cascade;

-- =========================================================
-- 1) PROFILES
-- =========================================================
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('player', 'coach', 'admin')),
  name text,
  grad_year int,
  coach_user_id uuid null,
  team_id uuid null,
  created_at timestamptz not null default now()
);

-- =========================================================
-- 2) COACHES (optional metadata; NOT used for joining teams)
-- =========================================================
create table public.coaches (
  user_id uuid primary key references public.profiles(user_id) on delete cascade,
  team_name text -- optional label; can be blank
);

-- =========================================================
-- 3) TEAMS (many per coach) + invite codes
-- =========================================================
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  coach_user_id uuid not null references public.profiles(user_id) on delete cascade,
  name text not null,
  invite_code text not null unique,
  created_at timestamptz not null default now(),
  unique (coach_user_id, name)
);

-- FK: players point at a real coach row
alter table public.profiles
  add constraint profiles_coach_fk
  foreign key (coach_user_id) references public.coaches(user_id);

-- FK: players optionally point at a team (we enforce non-null for players via trigger)
alter table public.profiles
  add constraint profiles_team_fk
  foreign key (team_id) references public.teams(id) on delete set null;

-- =========================================================
-- 4) TRIGGER: enforce role rules
-- =========================================================
create or replace function public.profiles_enforce_roles()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.role = 'player' then
    if new.coach_user_id is null then
      raise exception 'Players must have coach_user_id.';
    end if;
    if new.team_id is null then
      raise exception 'Players must have team_id.';
    end if;
  end if;

  if new.role = 'coach' then
    if new.coach_user_id is not null then
      raise exception 'Coaches cannot have coach_user_id.';
    end if;
    if new.team_id is not null then
      raise exception 'Coaches cannot have team_id.';
    end if;

    -- IMPORTANT: do NOT auto-create coaches row here.
    -- register_coach() handles it.
  end if;

  return new;
end$$;

create trigger trg_profiles_enforce_roles
before insert or update on public.profiles
for each row execute function public.profiles_enforce_roles();

-- =========================================================
-- 5) INTERACTIONS
-- =========================================================
create table public.interactions (
  id uuid primary key default gen_random_uuid(),
  occurred_on date not null default current_date,
  subject_user_id uuid not null references public.profiles(user_id) on delete cascade,
  created_by_user_id uuid not null references public.profiles(user_id) on delete cascade,
  type text,
  notes text,
  college_name text,
  created_at timestamptz not null default now()
);

-- subject must be a player
create or replace function public.interactions_enforce_subject_is_player()
returns trigger language plpgsql
set search_path = public
as $$
declare subject_role text;
begin
  select role into subject_role from public.profiles where user_id = new.subject_user_id;
  if subject_role is distinct from 'player' then
    raise exception 'subject_user_id must refer to a player profile.';
  end if;
  return new;
end$$;

create trigger trg_interactions_subject_role
before insert or update on public.interactions
for each row execute function public.interactions_enforce_subject_is_player();

-- always set actor to caller
create or replace function public.interactions_set_actor()
returns trigger language plpgsql
set search_path = public
as $$
begin
  new.created_by_user_id := auth.uid();
  return new;
end$$;

create trigger trg_interactions_set_actor
before insert on public.interactions
for each row execute function public.interactions_set_actor();

-- prevent changing subject/creator after insert
create or replace function public.interactions_enforce_immutable_fields()
returns trigger language plpgsql
set search_path = public
as $$
begin
  if new.subject_user_id is distinct from old.subject_user_id then
    raise exception 'subject_user_id is immutable';
  end if;
  if new.created_by_user_id is distinct from old.created_by_user_id then
    raise exception 'created_by_user_id is immutable';
  end if;
  return new;
end$$;

create trigger trg_interactions_immutable
before update on public.interactions
for each row execute function public.interactions_enforce_immutable_fields();

-- =========================================================
-- 6) RLS + POLICIES
-- =========================================================
alter table public.profiles enable row level security;
alter table public.coaches enable row level security;
alter table public.teams enable row level security;
alter table public.interactions enable row level security;

-- helper: subject on my roster? (coach only)
create or replace function public.subject_on_my_roster(sub uuid)
returns boolean
language sql stable
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p_sub
    join public.profiles me on me.user_id = auth.uid()
    where me.role = 'coach'
      and p_sub.user_id = sub
      and p_sub.role = 'player'
      and p_sub.coach_user_id = auth.uid()
  );
$$;

-- ---- PROFILES ----
create policy "profiles readable"
on public.profiles for select
to authenticated
using (
  user_id = auth.uid()
  or (role = 'player' and coach_user_id = auth.uid())
);

-- allow updating only your own row, but block changing role/coach_user_id/team_id
create policy "profiles updatable"
on public.profiles for update
to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and role = (select p.role from public.profiles p where p.user_id = auth.uid())
  and coach_user_id is not distinct from (select p.coach_user_id from public.profiles p where p.user_id = auth.uid())
  and team_id is not distinct from (select p.team_id from public.profiles p where p.user_id = auth.uid())
);

-- ---- COACHES ----
create policy "coaches readable"
on public.coaches for select
to authenticated
using (user_id = auth.uid());

create policy "coaches updatable"
on public.coaches for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- ---- TEAMS ----
create policy "teams readable"
on public.teams for select
to authenticated
using (coach_user_id = auth.uid());

create policy "teams insertable"
on public.teams for insert
to authenticated
with check (coach_user_id = auth.uid());

create policy "teams updatable"
on public.teams for update
to authenticated
using (coach_user_id = auth.uid())
with check (coach_user_id = auth.uid());

create policy "teams deletable"
on public.teams for delete
to authenticated
using (coach_user_id = auth.uid());

-- ---- INTERACTIONS ----
create policy "interactions readable"
on public.interactions for select
to authenticated
using (
  subject_user_id = auth.uid()
  or public.subject_on_my_roster(subject_user_id)
);

create policy "interactions insertable"
on public.interactions for insert
to authenticated
with check (
  created_by_user_id = auth.uid()
  and (
    subject_user_id = auth.uid()
    or public.subject_on_my_roster(subject_user_id)
  )
);

create policy "interactions updatable"
on public.interactions for update
to authenticated
using (
  created_by_user_id = auth.uid()
  and (subject_user_id = auth.uid() or public.subject_on_my_roster(subject_user_id))
)
with check (
  created_by_user_id = auth.uid()
  and (subject_user_id = auth.uid() or public.subject_on_my_roster(subject_user_id))
);

create policy "interactions deletable"
on public.interactions for delete
to authenticated
using (
  created_by_user_id = auth.uid()
  and (subject_user_id = auth.uid() or public.subject_on_my_roster(subject_user_id))
);

-- =========================================================
-- 7) Convenience view for coaches (includes team)
-- =========================================================
drop view if exists public.my_roster;

create view public.my_roster
with (security_invoker = true)
as
select
  p.user_id,
  p.name,
  p.grad_year,
  p.team_id,
  t.name as team_name
from public.profiles p
left join public.teams t on t.id = p.team_id
join public.profiles me on me.user_id = auth.uid()
where me.role = 'coach'
  and p.role = 'player'
  and p.coach_user_id = auth.uid();

grant select on public.my_roster to authenticated;

-- =========================================================
-- 8) RPCs for atomic signup + team creation
-- =========================================================

-- generate 8-char invite codes
create or replace function public.generate_invite_code()
returns text
language sql
set search_path = public
as $$
  select upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
$$;

-- Coach signup: creates coach profile + coaches metadata row (NO team created)
create or replace function public.register_coach(p_name text, p_team text)
returns table (coach_id uuid)
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles as pr (user_id, role, name, coach_user_id, team_id)
  values (auth.uid(), 'coach', p_name, null, null)
  on conflict (user_id) do update
    set role = 'coach',
        name = excluded.name,
        coach_user_id = null,
        team_id = null;

  insert into public.coaches(user_id, team_name)
  values (auth.uid(), nullif(p_team, ''))
  on conflict (user_id) do update
    set team_name = excluded.team_name;

  return query
  select auth.uid() as coach_id;
end$$;

-- Coach creates a team: returns team_id + invite_code
create or replace function public.create_team(p_name text)
returns table (team_id uuid, invite_code text)
language plpgsql
security definer
set search_path = public
as $$
declare v_code text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if (select role from public.profiles where user_id = auth.uid()) is distinct from 'coach' then
    raise exception 'Only coaches can create teams.';
  end if;

  loop
    v_code := public.generate_invite_code();
    begin
      insert into public.teams (coach_user_id, name, invite_code)
      values (auth.uid(), p_name, v_code)
      returning id, v_code into team_id, invite_code;
      return next;
      exit;
    exception when unique_violation then
      -- invite_code collision; retry
    end;
  end loop;
end$$;

-- Player signup: join by TEAM invite code
create or replace function public.register_player(p_name text, p_grad_year int, p_team_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_coach_id uuid;
  v_team_id uuid;
begin
  select t.coach_user_id, t.id
    into v_coach_id, v_team_id
  from public.teams t
  where t.invite_code = p_team_code;

  if v_team_id is null then
    raise exception 'Invalid team code.';
  end if;

  insert into public.profiles (user_id, role, name, grad_year, coach_user_id, team_id)
  values (auth.uid(), 'player', p_name, p_grad_year, v_coach_id, v_team_id)
  on conflict (user_id) do update
    set role = 'player',
        name = excluded.name,
        grad_year = excluded.grad_year,
        coach_user_id = excluded.coach_user_id,
        team_id = excluded.team_id;

  return auth.uid();
end$$;

-- Grants: only authenticated can call these
revoke execute on function public.register_coach(text, text) from public, anon;
revoke execute on function public.create_team(text) from public, anon;
revoke execute on function public.register_player(text, int, text) from public, anon;

grant execute on function public.register_coach(text, text) to authenticated;
grant execute on function public.create_team(text) to authenticated;
grant execute on function public.register_player(text, int, text) to authenticated;

-- Reduce attack surface
revoke truncate, trigger, references on table public.profiles from anon, authenticated;
revoke truncate, trigger, references on table public.coaches from anon, authenticated;
revoke truncate, trigger, references on table public.teams from anon, authenticated;
revoke truncate, trigger, references on table public.interactions from anon, authenticated;

-- =========================================================
-- 9) Indexes
-- =========================================================
create index if not exists interactions_subject_idx
  on public.interactions (subject_user_id, occurred_on desc);

create index if not exists interactions_created_by_idx
  on public.interactions (created_by_user_id, occurred_on desc);

create index if not exists profiles_coach_idx
  on public.profiles (coach_user_id);

create index if not exists profiles_team_idx
  on public.profiles (team_id);

create index if not exists teams_coach_idx
  on public.teams (coach_user_id);

create index if not exists teams_invite_code_idx
  on public.teams (invite_code);
