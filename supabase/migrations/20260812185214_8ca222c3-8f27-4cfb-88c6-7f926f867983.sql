-- ENUMS
create type public.app_role as enum ('membre','moderateur','admin');
create type public.approval_status as enum ('en_attente','approuve','refuse','desactive');
create type public.transmission_type as enum ('libre','essentiel');
create type public.transmission_status as enum ('ouvert','archive','supprime');
create type public.tag_type as enum ('libre','fonction','anatomie','intervention','materiel','personne','marque');

-- CONTENT TYPES (polymorphisme inter-modules)
create table public.content_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  created_at timestamptz not null default now()
);
grant select on public.content_types to authenticated;
grant all on public.content_types to service_role;
alter table public.content_types enable row level security;

-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  first_name text,
  last_name text,
  display_name text,
  initials text,
  job_title text,
  photo_url text,
  approval approval_status not null default 'en_attente',
  refusal_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

-- ROLES
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_approved(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = _user_id and approval = 'approuve')
$$;

create or replace function public.is_moderator(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(_user_id,'moderateur') or public.has_role(_user_id,'admin')
$$;

-- CATEGORIES
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  content_type_code text not null references public.content_types(code) on delete cascade,
  label text not null,
  color text not null default '#6b7280',
  position int not null default 0,
  created_at timestamptz not null default now(),
  unique (content_type_code, label)
);
grant select on public.categories to authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;

-- TAGS
create table public.tags (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  slug text not null unique,
  type tag_type not null default 'libre',
  created_at timestamptz not null default now()
);
grant select, insert on public.tags to authenticated;
grant all on public.tags to service_role;
alter table public.tags enable row level security;

-- TRANSMISSIONS
create table public.transmissions (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 100),
  content_html text not null,
  content_text text not null default '',
  type transmission_type not null default 'libre',
  status transmission_status not null default 'ouvert',
  is_priority boolean not null default false,
  author_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.transmissions to authenticated;
grant all on public.transmissions to service_role;
alter table public.transmissions enable row level security;
create index transmissions_created_idx on public.transmissions (created_at desc);

-- TAGGINGS (polymorphe)
create table public.taggings (
  id uuid primary key default gen_random_uuid(),
  tag_id uuid not null references public.tags(id) on delete cascade,
  content_type_code text not null references public.content_types(code) on delete cascade,
  content_id uuid not null,
  created_at timestamptz not null default now(),
  unique (tag_id, content_type_code, content_id)
);
grant select, insert, delete on public.taggings to authenticated;
grant all on public.taggings to service_role;
alter table public.taggings enable row level security;

-- IMAGES (polymorphe)
create table public.content_images (
  id uuid primary key default gen_random_uuid(),
  content_type_code text not null references public.content_types(code) on delete cascade,
  content_id uuid not null,
  storage_path text not null,
  position int not null default 1,
  created_at timestamptz not null default now()
);
grant select, insert, delete on public.content_images to authenticated;
grant all on public.content_images to service_role;
alter table public.content_images enable row level security;

-- updated_at
create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;
create trigger transmissions_touch before update on public.transmissions
  for each row execute function public.touch_updated_at();
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- POLICIES: content_types / categories / tags
create policy "read content types" on public.content_types for select to authenticated using (public.is_approved(auth.uid()));
create policy "read categories" on public.categories for select to authenticated using (public.is_approved(auth.uid()));
create policy "admins manage categories" on public.categories for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "read tags" on public.tags for select to authenticated using (public.is_approved(auth.uid()));
create policy "approved create tags" on public.tags for insert to authenticated with check (public.is_approved(auth.uid()));

-- POLICIES: profiles
create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid());
create policy "approved read profiles" on public.profiles for select to authenticated using (public.is_approved(auth.uid()));
create policy "admin read profiles" on public.profiles for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "own profile insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid() and approval = (select p.approval from public.profiles p where p.id = auth.uid()));
create policy "admin update profiles" on public.profiles for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- POLICIES: user_roles
create policy "own roles read" on public.user_roles for select to authenticated using (user_id = auth.uid());
create policy "admin manage roles" on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- POLICIES: transmissions
create policy "approved read transmissions" on public.transmissions for select to authenticated
  using (public.is_approved(auth.uid()) and (status <> 'supprime' or author_id = auth.uid() or public.is_moderator(auth.uid())));
create policy "approved create transmissions" on public.transmissions for insert to authenticated
  with check (public.is_approved(auth.uid()) and author_id = auth.uid());
create policy "author or staff update" on public.transmissions for update to authenticated
  using (public.is_approved(auth.uid()) and (author_id = auth.uid() or public.is_moderator(auth.uid())))
  with check (public.is_approved(auth.uid()) and (author_id = auth.uid() or public.is_moderator(auth.uid())));
create policy "admin delete transmissions" on public.transmissions for delete to authenticated
  using (public.has_role(auth.uid(),'admin'));

-- POLICIES: taggings & images (rattachés à une transmission accessible)
create or replace function public.can_edit_transmission(_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.transmissions t
    where t.id = _id and (t.author_id = auth.uid() or public.is_moderator(auth.uid()))
  )
$$;

create policy "read taggings" on public.taggings for select to authenticated using (public.is_approved(auth.uid()));
create policy "write taggings" on public.taggings for insert to authenticated with check (public.can_edit_transmission(content_id));
create policy "delete taggings" on public.taggings for delete to authenticated using (public.can_edit_transmission(content_id));
create policy "read images" on public.content_images for select to authenticated using (public.is_approved(auth.uid()));
create policy "write images" on public.content_images for insert to authenticated with check (public.can_edit_transmission(content_id));
create policy "delete images" on public.content_images for delete to authenticated using (public.can_edit_transmission(content_id));

-- BOOTSTRAP PROFIL (premier compte = admin approuvé)
create or replace function public.ensure_profile(_first_name text default null, _last_name text default null, _photo_url text default null)
returns public.profiles language plpgsql security definer set search_path = public as $$
declare
  _uid uuid := auth.uid();
  _email text;
  _existing public.profiles;
  _count int;
  _fn text; _ln text; _ini text;
begin
  if _uid is null then raise exception 'not authenticated'; end if;
  select * into _existing from public.profiles where id = _uid;
  if found then return _existing; end if;

  select email into _email from auth.users where id = _uid;
  _fn := coalesce(nullif(trim(_first_name),''), split_part(coalesce(_email,''),'@',1));
  _ln := coalesce(nullif(trim(_last_name),''), '');
  _ini := upper(left(coalesce(_fn,'?'),1)) || upper(left(nullif(_ln,''),1));

  select count(*) into _count from public.profiles;

  insert into public.profiles (id, email, first_name, last_name, display_name, initials, photo_url, approval)
  values (_uid, _email, _fn, nullif(_ln,''), trim(_fn || ' ' || coalesce(_ln,'')), _ini, _photo_url,
          case when _count = 0 then 'approuve'::approval_status else 'en_attente'::approval_status end)
  returning * into _existing;

  insert into public.user_roles (user_id, role)
  values (_uid, case when _count = 0 then 'admin'::app_role else 'membre'::app_role end)
  on conflict do nothing;

  return _existing;
end; $$;
grant execute on function public.ensure_profile(text,text,text) to authenticated;

-- SEED
insert into public.content_types (code, label) values
  ('transmissions','Transmissions'),
  ('glossaire','Glossaire'),
  ('thesaurus','Thesaurus'),
  ('arsenal','Arsenal'),
  ('picking','Picking');

insert into public.categories (content_type_code, label, color, position) values
  ('transmissions','Organisation','#6366f1',1),
  ('transmissions','Matériel','#f59e0b',2),
  ('transmissions','Patient','#ef4444',3),
  ('transmissions','Équipe','#10b981',4),
  ('transmissions','Formation','#8b5cf6',5),
  ('transmissions','Divers','#6b7280',6);