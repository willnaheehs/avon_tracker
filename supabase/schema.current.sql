-- =========================================================
-- REPURPOSE: provider/client roster + threaded notes
-- Single staff role: provider
-- Providers create organizations and invite clients
-- Clients can exchange notes with assigned providers
-- =========================================================

create extension if not exists pgcrypto;

-- ---------- Drop old views first ----------
drop view if exists public.my_caseload cascade;
drop view if exists public.my_roster cascade;

-- ---------- Drop old tables ----------
drop table if exists public.notes cascade;
drop table if exists public.note_threads cascade;
drop table if exists public.provider_client_assignments cascade;
drop table if exists public.provider_organizations cascade;
drop table if exists public.organizations cascade;
drop table if exists public.interactions cascade;
drop table if exists public.teams cascade;
drop table if exists public.coaches cascade;
drop table if exists public.profiles cascade;
drop table if exists public.players cascade;

-- ---------- Drop old/new helper functions/triggers ----------
drop function if exists public.generate_invite_code() cascade;
drop function if exists public.is_provider() cascade;
drop function if exists public.is_client() cascade;
drop function if exists public.is_provider_in_organization(uuid) cascade;
drop function if exists public.is_provider_owner_in_organization(uuid) cascade;
drop function if exists public.client_on_my_caseload(uuid) cascade;
drop function if exists public.thread_on_my_caseload(uuid) cascade;
drop function if exists public.profiles_enforce_roles() cascade;
drop function if exists public.provider_membership_enforce_role() cascade;
drop function if exists public.assignment_enforce_roles() cascade;
drop function if exists public.notes_set_author() cascade;
drop function if exists public.notes_enforce_immutable_fields() cascade;
drop function if exists public.register_provider(text) cascade;
drop function if exists public.create_organization(text) cascade;
drop function if exists public.register_client(text,text) cascade;
drop function if exists public.create_note_thread(uuid,text,uuid) cascade;

-- =========================================================
-- 1) PROFILES
-- =========================================================
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('provider', 'client', 'admin')),
  name text,
  created_at timestamptz not null default now()
);

create or replace function public.profiles_enforce_roles()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.role not in ('provider', 'client', 'admin') then
    raise exception 'Invalid profile role.';
  end if;

  return new;
end$$;

create trigger trg_profiles_enforce_roles
before insert or update on public.profiles
for each row execute function public.profiles_enforce_roles();

-- =========================================================
-- 2) ORGANIZATIONS
-- =========================================================
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  created_by_user_id uuid not null references public.profiles(user_id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.provider_organizations (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider_user_id uuid not null references public.profiles(user_id) on delete cascade,
  membership_role text not null default 'owner' check (membership_role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (organization_id, provider_user_id)
);

create or replace function public.provider_membership_enforce_role()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_role text;
begin
  select role into v_role
  from public.profiles
  where user_id = new.provider_user_id;

  if v_role is distinct from 'provider' then
    raise exception 'provider_user_id must refer to a provider profile.';
  end if;

  return new;
end$$;

create trigger trg_provider_membership_enforce_role
before insert or update on public.provider_organizations
for each row execute function public.provider_membership_enforce_role();

-- =========================================================
-- 3) CASELOAD ASSIGNMENTS
-- =========================================================
create table public.provider_client_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider_user_id uuid not null references public.profiles(user_id) on delete cascade,
  client_user_id uuid not null references public.profiles(user_id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_by_user_id uuid not null references public.profiles(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (organization_id, provider_user_id, client_user_id)
);

create or replace function public.assignment_enforce_roles()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_provider_role text;
  v_client_role text;
begin
  select role into v_provider_role
  from public.profiles
  where user_id = new.provider_user_id;

  if v_provider_role is distinct from 'provider' then
    raise exception 'provider_user_id must refer to a provider profile.';
  end if;

  select role into v_client_role
  from public.profiles
  where user_id = new.client_user_id;

  if v_client_role is distinct from 'client' then
    raise exception 'client_user_id must refer to a client profile.';
  end if;

  return new;
end$$;

create trigger trg_assignment_enforce_roles
before insert or update on public.provider_client_assignments
for each row execute function public.assignment_enforce_roles();

-- =========================================================
-- 4) NOTE THREADS + NOTES
-- =========================================================
create table public.note_threads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_user_id uuid not null references public.profiles(user_id) on delete cascade,
  created_by_user_id uuid not null references public.profiles(user_id) on delete cascade,
  subject text,
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now(),
  unique (organization_id, client_user_id)
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.note_threads(id) on delete cascade,
  author_user_id uuid not null references public.profiles(user_id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create or replace function public.notes_set_author()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.author_user_id := auth.uid();
  return new;
end$$;

create trigger trg_notes_set_author
before insert on public.notes
for each row execute function public.notes_set_author();

create or replace function public.notes_enforce_immutable_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.thread_id is distinct from old.thread_id then
    raise exception 'thread_id is immutable';
  end if;
  if new.author_user_id is distinct from old.author_user_id then
    raise exception 'author_user_id is immutable';
  end if;
  return new;
end$$;

create trigger trg_notes_immutable
before update on public.notes
for each row execute function public.notes_enforce_immutable_fields();

-- =========================================================
-- 5) HELPERS
-- =========================================================
create or replace function public.generate_invite_code()
returns text
language sql
set search_path = public
as $$
  select upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
$$;

create or replace function public.is_provider()
returns boolean
language sql stable
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where user_id = auth.uid()
      and role = 'provider'
  );
$$;

create or replace function public.is_client()
returns boolean
language sql stable
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where user_id = auth.uid()
      and role = 'client'
  );
$$;

create or replace function public.client_on_my_caseload(p_client_user_id uuid)
returns boolean
language sql stable
set search_path = public
as $$
  select exists (
    select 1
    from public.provider_client_assignments a
    where a.provider_user_id = auth.uid()
      and a.client_user_id = p_client_user_id
      and a.status = 'active'
  );
$$;

create or replace function public.is_provider_in_organization(p_organization_id uuid)
returns boolean
language sql stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.provider_organizations po
    where po.organization_id = p_organization_id
      and po.provider_user_id = auth.uid()
  );
$$;

create or replace function public.is_provider_owner_in_organization(p_organization_id uuid)
returns boolean
language sql stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.provider_organizations po
    where po.organization_id = p_organization_id
      and po.provider_user_id = auth.uid()
      and po.membership_role = 'owner'
  );
$$;

create or replace function public.thread_on_my_caseload(p_thread_id uuid)
returns boolean
language sql stable
set search_path = public
as $$
  select exists (
    select 1
    from public.note_threads t
    where t.id = p_thread_id
      and (
        t.client_user_id = auth.uid()
        or public.client_on_my_caseload(t.client_user_id)
      )
  );
$$;

-- =========================================================
-- 6) RLS + POLICIES
-- =========================================================
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.provider_organizations enable row level security;
alter table public.provider_client_assignments enable row level security;
alter table public.note_threads enable row level security;
alter table public.notes enable row level security;

-- ---- PROFILES ----
create policy "profiles readable"
on public.profiles for select
to authenticated
using (
  user_id = auth.uid()
  or public.client_on_my_caseload(user_id)
  or exists (
    select 1
    from public.provider_client_assignments a
    where a.client_user_id = auth.uid()
      and a.provider_user_id = profiles.user_id
      and a.status = 'active'
  )
);

create policy "profiles insertable via self only"
on public.profiles for insert
to authenticated
with check (user_id = auth.uid());

create policy "profiles updatable"
on public.profiles for update
to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and role = (select p.role from public.profiles p where p.user_id = auth.uid())
);

-- ---- ORGANIZATIONS ----
create policy "organizations readable"
on public.organizations for select
to authenticated
using (
  created_by_user_id = auth.uid()
  or public.is_provider_in_organization(organizations.id)
  or exists (
    select 1
    from public.provider_client_assignments a
    where a.organization_id = organizations.id
      and a.client_user_id = auth.uid()
      and a.status = 'active'
  )
);

create policy "organizations insertable"
on public.organizations for insert
to authenticated
with check (
  created_by_user_id = auth.uid()
  and public.is_provider()
);

create policy "organizations updatable by member providers"
on public.organizations for update
to authenticated
using (
  public.is_provider_in_organization(organizations.id)
)
with check (
  public.is_provider_in_organization(organizations.id)
);

create policy "organizations deletable by owner"
on public.organizations for delete
to authenticated
using (
  public.is_provider_owner_in_organization(organizations.id)
);

-- ---- PROVIDER ORGANIZATIONS ----
create policy "provider organizations readable"
on public.provider_organizations for select
to authenticated
using (
  provider_user_id = auth.uid()
  or public.is_provider_in_organization(provider_organizations.organization_id)
);

create policy "provider organizations insertable by owner"
on public.provider_organizations for insert
to authenticated
with check (
  public.is_provider()
  and public.is_provider_owner_in_organization(provider_organizations.organization_id)
);

create policy "provider organizations updatable by owner"
on public.provider_organizations for update
to authenticated
using (
  public.is_provider_owner_in_organization(provider_organizations.organization_id)
)
with check (
  public.is_provider_owner_in_organization(provider_organizations.organization_id)
);

create policy "provider organizations deletable by owner"
on public.provider_organizations for delete
to authenticated
using (
  public.is_provider_owner_in_organization(provider_organizations.organization_id)
);

-- ---- ASSIGNMENTS ----
create policy "assignments readable"
on public.provider_client_assignments for select
to authenticated
using (
  provider_user_id = auth.uid()
  or client_user_id = auth.uid()
  or public.is_provider_in_organization(provider_client_assignments.organization_id)
);

create policy "assignments insertable by organization providers"
on public.provider_client_assignments for insert
to authenticated
with check (
  public.is_provider()
  and created_by_user_id = auth.uid()
  and public.is_provider_in_organization(provider_client_assignments.organization_id)
);

create policy "assignments updatable by organization providers"
on public.provider_client_assignments for update
to authenticated
using (
  public.is_provider_in_organization(provider_client_assignments.organization_id)
)
with check (
  public.is_provider_in_organization(provider_client_assignments.organization_id)
);

create policy "assignments deletable by organization providers"
on public.provider_client_assignments for delete
to authenticated
using (
  public.is_provider_in_organization(provider_client_assignments.organization_id)
);

-- ---- NOTE THREADS ----
create policy "threads readable"
on public.note_threads for select
to authenticated
using (
  client_user_id = auth.uid()
  or public.client_on_my_caseload(client_user_id)
);

create policy "threads insertable by assigned providers"
on public.note_threads for insert
to authenticated
with check (
  created_by_user_id = auth.uid()
  and public.is_provider()
  and exists (
    select 1
    from public.provider_client_assignments a
    where a.organization_id = note_threads.organization_id
      and a.provider_user_id = auth.uid()
      and a.client_user_id = note_threads.client_user_id
      and a.status = 'active'
  )
);

create policy "threads updatable by assigned providers"
on public.note_threads for update
to authenticated
using (
  public.client_on_my_caseload(client_user_id)
)
with check (
  public.client_on_my_caseload(client_user_id)
);

-- ---- NOTES ----
create policy "notes readable"
on public.notes for select
to authenticated
using (
  public.thread_on_my_caseload(thread_id)
);

create policy "notes insertable"
on public.notes for insert
to authenticated
with check (
  author_user_id = auth.uid()
  and public.thread_on_my_caseload(thread_id)
);

create policy "notes updatable by author"
on public.notes for update
to authenticated
using (
  author_user_id = auth.uid()
  and public.thread_on_my_caseload(thread_id)
)
with check (
  author_user_id = auth.uid()
  and public.thread_on_my_caseload(thread_id)
);

create policy "notes deletable by author"
on public.notes for delete
to authenticated
using (
  author_user_id = auth.uid()
  and public.thread_on_my_caseload(thread_id)
);

-- =========================================================
-- 7) CONVENIENCE VIEW
-- =========================================================
create view public.my_caseload
with (security_invoker = true)
as
select
  a.id as assignment_id,
  a.organization_id,
  o.name as organization_name,
  a.provider_user_id,
  a.client_user_id,
  c.name as client_name,
  a.status,
  a.created_at
from public.provider_client_assignments a
join public.profiles c on c.user_id = a.client_user_id
join public.organizations o on o.id = a.organization_id
where a.provider_user_id = auth.uid();

grant select on public.my_caseload to authenticated;

-- =========================================================
-- 8) RPCs
-- =========================================================
create or replace function public.register_provider(p_name text)
returns table (provider_id uuid)
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, role, name)
  values (auth.uid(), 'provider', nullif(trim(p_name), ''))
  on conflict (user_id) do update
    set role = 'provider',
        name = excluded.name;

  return query
  select auth.uid() as provider_id;
end$$;

create or replace function public.create_organization(p_name text)
returns table (organization_id uuid, invite_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_organization_id uuid;
  v_invite_code text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_provider() then
    raise exception 'Only providers can create organizations.';
  end if;

  loop
    v_code := public.generate_invite_code();
    begin
      insert into public.organizations (name, invite_code, created_by_user_id)
      values (p_name, v_code, auth.uid())
      returning public.organizations.id, public.organizations.invite_code
      into v_organization_id, v_invite_code;

      insert into public.provider_organizations (organization_id, provider_user_id, membership_role)
      values (v_organization_id, auth.uid(), 'owner')
      on conflict do nothing;

      organization_id := v_organization_id;
      invite_code := v_invite_code;
      return next;
      exit;
    exception when unique_violation then
      -- invite_code collision; retry
    end;
  end loop;
end$$;

create or replace function public.register_client(p_name text, p_invite_code text)
returns table (client_id uuid, organization_id uuid, thread_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_provider_id uuid;
  v_organization_id uuid;
  v_thread_id uuid;
begin
  select o.id, o.created_by_user_id
    into v_organization_id, v_owner_provider_id
  from public.organizations o
  where o.invite_code = p_invite_code;

  if v_organization_id is null then
    raise exception 'Invalid invite code.';
  end if;

  insert into public.profiles (user_id, role, name)
  values (auth.uid(), 'client', nullif(trim(p_name), ''))
  on conflict (user_id) do update
    set role = 'client',
        name = excluded.name;

  insert into public.provider_client_assignments (
    organization_id,
    provider_user_id,
    client_user_id,
    status,
    created_by_user_id
  )
  values (
    v_organization_id,
    v_owner_provider_id,
    auth.uid(),
    'active',
    v_owner_provider_id
  )
  on conflict do nothing;

  update public.provider_client_assignments
  set status = 'active'
  where public.provider_client_assignments.organization_id = v_organization_id
    and public.provider_client_assignments.provider_user_id = v_owner_provider_id
    and public.provider_client_assignments.client_user_id = auth.uid();

  insert into public.note_threads (
    organization_id,
    client_user_id,
    created_by_user_id,
    subject,
    status
  )
  values (
    v_organization_id,
    auth.uid(),
    v_owner_provider_id,
    'General Notes',
    'open'
  )
  on conflict do nothing;

  update public.note_threads
  set status = 'open'
  where public.note_threads.organization_id = v_organization_id
    and public.note_threads.client_user_id = auth.uid();

  select nt.id
    into v_thread_id
  from public.note_threads nt
  where nt.organization_id = v_organization_id
    and nt.client_user_id = auth.uid();

  client_id := auth.uid();
  organization_id := v_organization_id;
  thread_id := v_thread_id;
  return query
  select auth.uid(), v_organization_id, v_thread_id;
end$$;

create or replace function public.create_note_thread(
  p_client_user_id uuid,
  p_subject text default null,
  p_organization_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_thread_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_provider() then
    raise exception 'Only providers can create note threads.';
  end if;

  if p_organization_id is not null then
    v_org_id := p_organization_id;
  else
    select a.organization_id
      into v_org_id
    from public.provider_client_assignments a
    where a.provider_user_id = auth.uid()
      and a.client_user_id = p_client_user_id
      and a.status = 'active'
    order by a.created_at asc
    limit 1;
  end if;

  if v_org_id is null then
    raise exception 'No active assignment found for this client.';
  end if;

  insert into public.note_threads (
    organization_id,
    client_user_id,
    created_by_user_id,
    subject,
    status
  )
  values (
    v_org_id,
    p_client_user_id,
    auth.uid(),
    nullif(trim(p_subject), ''),
    'open'
  )
  on conflict (organization_id, client_user_id) do update
    set subject = coalesce(excluded.subject, public.note_threads.subject),
        status = 'open'
  returning id into v_thread_id;

  return v_thread_id;
end$$;

-- Grants
revoke execute on function public.register_provider(text) from public, anon;
revoke execute on function public.create_organization(text) from public, anon;
revoke execute on function public.register_client(text, text) from public, anon;
revoke execute on function public.create_note_thread(uuid, text, uuid) from public, anon;

grant execute on function public.register_provider(text) to authenticated;
grant execute on function public.create_organization(text) to authenticated;
grant execute on function public.register_client(text, text) to authenticated;
grant execute on function public.create_note_thread(uuid, text, uuid) to authenticated;

-- Reduce attack surface
revoke truncate, trigger, references on table public.profiles from anon, authenticated;
revoke truncate, trigger, references on table public.organizations from anon, authenticated;
revoke truncate, trigger, references on table public.provider_organizations from anon, authenticated;
revoke truncate, trigger, references on table public.provider_client_assignments from anon, authenticated;
revoke truncate, trigger, references on table public.note_threads from anon, authenticated;
revoke truncate, trigger, references on table public.notes from anon, authenticated;

-- =========================================================
-- 9) Indexes
-- =========================================================
create index if not exists organizations_invite_code_idx
  on public.organizations (invite_code);

create index if not exists provider_organizations_provider_idx
  on public.provider_organizations (provider_user_id, organization_id);

create index if not exists assignments_provider_idx
  on public.provider_client_assignments (provider_user_id, status, created_at desc);

create index if not exists assignments_client_idx
  on public.provider_client_assignments (client_user_id, status, created_at desc);

create index if not exists assignments_organization_idx
  on public.provider_client_assignments (organization_id, status, created_at desc);

create index if not exists threads_client_idx
  on public.note_threads (client_user_id, created_at desc);

create index if not exists threads_organization_idx
  on public.note_threads (organization_id, created_at desc);

create index if not exists notes_thread_idx
  on public.notes (thread_id, created_at asc);

create index if not exists notes_author_idx
  on public.notes (author_user_id, created_at desc);
