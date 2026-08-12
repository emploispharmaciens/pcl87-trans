create table public.invites (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  password_hash text not null,
  label text,
  grant_role app_role not null default 'membre',
  expires_at timestamptz,
  max_uses integer,
  uses integer not null default 0,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.invites to authenticated;
grant all on public.invites to service_role;

alter table public.invites enable row level security;

create policy "admins manage invites" on public.invites for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create trigger invites_touch before update on public.invites
  for each row execute function public.touch_updated_at();

create or replace function public.ensure_profile(_first_name text default null::text, _last_name text default null::text, _photo_url text default null::text)
returns profiles
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  _uid uuid := auth.uid();
  _email text;
  _existing public.profiles;
  _count int;
  _fn text; _ln text; _ini text;
  _is_owner boolean;
begin
  if _uid is null then raise exception 'not authenticated'; end if;

  select email into _email from auth.users where id = _uid;
  _is_owner := lower(coalesce(_email,'')) = 'manuel.rohaut@gmail.com';

  select * into _existing from public.profiles where id = _uid;
  if found then
    if _is_owner then
      update public.profiles set approval = 'approuve'
        where id = _uid and approval <> 'approuve'
        returning * into _existing;
      if _existing is null then select * into _existing from public.profiles where id = _uid; end if;
      insert into public.user_roles (user_id, role) values (_uid, 'admin') on conflict do nothing;
    end if;
    return _existing;
  end if;

  _fn := coalesce(nullif(trim(_first_name),''), split_part(coalesce(_email,''),'@',1));
  _ln := coalesce(nullif(trim(_last_name),''), '');
  _ini := upper(left(coalesce(_fn,'?'),1)) || upper(left(nullif(_ln,''),1));

  select count(*) into _count from public.profiles;

  insert into public.profiles (id, email, first_name, last_name, display_name, initials, photo_url, approval)
  values (_uid, _email, _fn, nullif(_ln,''), trim(_fn || ' ' || coalesce(_ln,'')), _ini, _photo_url,
          case when _count = 0 or _is_owner then 'approuve'::approval_status else 'en_attente'::approval_status end)
  returning * into _existing;

  insert into public.user_roles (user_id, role)
  values (_uid, case when _count = 0 or _is_owner then 'admin'::app_role else 'membre'::app_role end)
  on conflict do nothing;

  return _existing;
end; $function$;