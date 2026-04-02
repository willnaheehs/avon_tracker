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

drop policy if exists "organizations readable" on public.organizations;
drop policy if exists "organizations updatable by member providers" on public.organizations;
drop policy if exists "organizations deletable by owner" on public.organizations;
drop policy if exists "provider organizations readable" on public.provider_organizations;
drop policy if exists "provider organizations insertable by owner" on public.provider_organizations;
drop policy if exists "provider organizations updatable by owner" on public.provider_organizations;
drop policy if exists "provider organizations deletable by owner" on public.provider_organizations;
drop policy if exists "assignments readable" on public.provider_client_assignments;
drop policy if exists "assignments insertable by organization providers" on public.provider_client_assignments;
drop policy if exists "assignments updatable by organization providers" on public.provider_client_assignments;
drop policy if exists "assignments deletable by organization providers" on public.provider_client_assignments;

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

create policy "organizations updatable by member providers"
on public.organizations for update
to authenticated
using (public.is_provider_in_organization(organizations.id))
with check (public.is_provider_in_organization(organizations.id));

create policy "organizations deletable by owner"
on public.organizations for delete
to authenticated
using (public.is_provider_owner_in_organization(organizations.id));

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
using (public.is_provider_owner_in_organization(provider_organizations.organization_id))
with check (public.is_provider_owner_in_organization(provider_organizations.organization_id));

create policy "provider organizations deletable by owner"
on public.provider_organizations for delete
to authenticated
using (public.is_provider_owner_in_organization(provider_organizations.organization_id));

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
using (public.is_provider_in_organization(provider_client_assignments.organization_id))
with check (public.is_provider_in_organization(provider_client_assignments.organization_id));

create policy "assignments deletable by organization providers"
on public.provider_client_assignments for delete
to authenticated
using (public.is_provider_in_organization(provider_client_assignments.organization_id));
