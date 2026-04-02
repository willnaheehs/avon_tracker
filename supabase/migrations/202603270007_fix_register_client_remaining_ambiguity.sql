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

  return query
  select auth.uid(), v_organization_id, v_thread_id;
end$$;
