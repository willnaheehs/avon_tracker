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
