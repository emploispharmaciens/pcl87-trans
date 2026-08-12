-- 1. Private schema for internal authorization helpers (not exposed to the API)
create schema if not exists private;
revoke all on schema private from anon, authenticated;
grant usage on schema private to authenticated, service_role;

create or replace function private.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path to 'public'
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create or replace function private.is_approved(_user_id uuid)
returns boolean language sql stable security definer set search_path to 'public'
as $$ select exists (select 1 from public.profiles where id = _user_id and approval = 'approuve') $$;

create or replace function private.is_moderator(_user_id uuid)
returns boolean language sql stable security definer set search_path to 'public'
as $$ select private.has_role(_user_id,'moderateur') or private.has_role(_user_id,'admin') $$;

create or replace function private.can_edit_transmission(_id uuid)
returns boolean language sql stable security definer set search_path to 'public'
as $$
  select exists (
    select 1 from public.transmissions t
    where t.id = _id and (t.author_id = auth.uid() or private.is_moderator(auth.uid()))
  )
$$;

revoke all on function private.has_role(uuid, public.app_role) from public;
revoke all on function private.is_approved(uuid) from public;
revoke all on function private.is_moderator(uuid) from public;
revoke all on function private.can_edit_transmission(uuid) from public;
grant execute on function private.has_role(uuid, public.app_role) to authenticated, service_role;
grant execute on function private.is_approved(uuid) to authenticated, service_role;
grant execute on function private.is_moderator(uuid) to authenticated, service_role;
grant execute on function private.can_edit_transmission(uuid) to authenticated, service_role;

-- 2. Recreate policies against the private helpers
drop policy if exists "read content types" on public.content_types;
create policy "read content types" on public.content_types for select to authenticated
  using (private.is_approved(auth.uid()));

drop policy if exists "read categories" on public.categories;
create policy "read categories" on public.categories for select to authenticated
  using (private.is_approved(auth.uid()));
drop policy if exists "admins manage categories" on public.categories;
create policy "admins manage categories" on public.categories for all to authenticated
  using (private.has_role(auth.uid(),'admin')) with check (private.has_role(auth.uid(),'admin'));

drop policy if exists "read tags" on public.tags;
create policy "read tags" on public.tags for select to authenticated
  using (private.is_approved(auth.uid()));
drop policy if exists "approved create tags" on public.tags;
create policy "approved create tags" on public.tags for insert to authenticated
  with check (private.is_approved(auth.uid()));

drop policy if exists "approved read profiles" on public.profiles;
create policy "approved read profiles" on public.profiles for select to authenticated
  using (private.is_approved(auth.uid()));
drop policy if exists "admin read profiles" on public.profiles;
create policy "admin read profiles" on public.profiles for select to authenticated
  using (private.has_role(auth.uid(),'admin'));
drop policy if exists "admin update profiles" on public.profiles;
create policy "admin update profiles" on public.profiles for update to authenticated
  using (private.has_role(auth.uid(),'admin')) with check (private.has_role(auth.uid(),'admin'));

drop policy if exists "own roles read" on public.user_roles;
create policy "own roles read" on public.user_roles for select to authenticated
  using (user_id = auth.uid());
drop policy if exists "admin manage roles" on public.user_roles;
create policy "admin manage roles" on public.user_roles for all to authenticated
  using (private.has_role(auth.uid(),'admin')) with check (private.has_role(auth.uid(),'admin'));

drop policy if exists "approved read transmissions" on public.transmissions;
create policy "approved read transmissions" on public.transmissions for select to authenticated
  using (private.is_approved(auth.uid()) and (status <> 'supprime' or author_id = auth.uid() or private.is_moderator(auth.uid())));
drop policy if exists "approved create transmissions" on public.transmissions;
create policy "approved create transmissions" on public.transmissions for insert to authenticated
  with check (private.is_approved(auth.uid()) and author_id = auth.uid());
drop policy if exists "author or staff update" on public.transmissions;
create policy "author or staff update" on public.transmissions for update to authenticated
  using (private.is_approved(auth.uid()) and (author_id = auth.uid() or private.is_moderator(auth.uid())))
  with check (private.is_approved(auth.uid()) and (author_id = auth.uid() or private.is_moderator(auth.uid())));
drop policy if exists "admin delete transmissions" on public.transmissions;
create policy "admin delete transmissions" on public.transmissions for delete to authenticated
  using (private.has_role(auth.uid(),'admin'));

drop policy if exists "read taggings" on public.taggings;
create policy "read taggings" on public.taggings for select to authenticated
  using (private.is_approved(auth.uid()));
drop policy if exists "write taggings" on public.taggings;
create policy "write taggings" on public.taggings for insert to authenticated
  with check (private.can_edit_transmission(content_id));
drop policy if exists "delete taggings" on public.taggings;
create policy "delete taggings" on public.taggings for delete to authenticated
  using (private.can_edit_transmission(content_id));

drop policy if exists "read images" on public.content_images;
create policy "read images" on public.content_images for select to authenticated
  using (private.is_approved(auth.uid()));
drop policy if exists "write images" on public.content_images;
create policy "write images" on public.content_images for insert to authenticated
  with check (private.can_edit_transmission(content_id));
drop policy if exists "delete images" on public.content_images;
create policy "delete images" on public.content_images for delete to authenticated
  using (private.can_edit_transmission(content_id));
-- 3. Explicit UPDATE control for content images
drop policy if exists "update images" on public.content_images;
create policy "update images" on public.content_images for update to authenticated
  using (private.can_edit_transmission(content_id))
  with check (private.can_edit_transmission(content_id));

drop policy if exists "admins manage invites" on public.invites;
create policy "admins manage invites" on public.invites for all to authenticated
  using (private.has_role(auth.uid(),'admin')) with check (private.has_role(auth.uid(),'admin'));

-- 4. Remove the publicly callable SECURITY DEFINER functions
drop function if exists public.can_edit_transmission(uuid);
drop function if exists public.is_moderator(uuid);
drop function if exists public.is_approved(uuid);
drop function if exists public.has_role(uuid, public.app_role);
drop function if exists public.ensure_profile(text, text, text);

-- 5. Storage policies for the private "transmissions" bucket
drop policy if exists "approved read transmission files" on storage.objects;
create policy "approved read transmission files" on storage.objects for select to authenticated
  using (bucket_id = 'transmissions' and private.is_approved(auth.uid()));

drop policy if exists "staff write transmission files" on storage.objects;
create policy "staff write transmission files" on storage.objects for insert to authenticated
  with check (bucket_id = 'transmissions' and private.is_moderator(auth.uid()));

drop policy if exists "staff update transmission files" on storage.objects;
create policy "staff update transmission files" on storage.objects for update to authenticated
  using (bucket_id = 'transmissions' and private.is_moderator(auth.uid()))
  with check (bucket_id = 'transmissions' and private.is_moderator(auth.uid()));

drop policy if exists "staff delete transmission files" on storage.objects;
create policy "staff delete transmission files" on storage.objects for delete to authenticated
  using (bucket_id = 'transmissions' and private.is_moderator(auth.uid()));