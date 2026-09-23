-- =====================================================================
-- Module Sutures — trace des tables + règles d'accès
-- Date : 23/09/2026
-- But :
--   1. Écrire dans le dépôt la structure réelle des 3 tables sutures
--      (elles ont été créées hors migration).
--   2. Remplacer les règles « tout le monde connecté peut tout faire »
--      par : lecture = comptes approuvés, écriture = admins.
-- Sans risque si relancé : chaque étape vérifie avant d'agir.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. Structure (déjà présente en base : ces ordres ne font rien)
-- ---------------------------------------------------------------------

create table if not exists public.sutures (
  id            uuid primary key default gen_random_uuid(),
  marque        text,
  calibre       text,
  type_aiguille text,
  reference     text,
  photo_url     text,
  usage_notes   text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  slug          text unique,
  famille       text,
  longueur      text,
  composition   text,
  couleur       text,
  statut        text default 'actif',
  source        text,
  note_qualite  text,
  cours         text
);

create table if not exists public.protocoles (
  id          uuid primary key default gen_random_uuid(),
  nom         text not null,
  description text,
  created_at  timestamptz not null default now(),
  slug        text unique,
  region      text,
  updated_at  timestamptz default now()
);

create table if not exists public.suture_protocoles (
  suture_id    uuid not null references public.sutures(id) on delete cascade,
  protocole_id uuid not null references public.protocoles(id) on delete cascade,
  quantite     text,
  note         text,
  primary key (suture_id, protocole_id)
);

alter table public.sutures           enable row level security;
alter table public.protocoles        enable row level security;
alter table public.suture_protocoles enable row level security;

-- ---------------------------------------------------------------------
-- 2. Suppression des règles trop ouvertes
-- ---------------------------------------------------------------------

drop policy if exists "all sutures"           on public.sutures;
drop policy if exists "all protocoles"        on public.protocoles;
drop policy if exists "all suture_protocoles" on public.suture_protocoles;

-- ---------------------------------------------------------------------
-- 3. Nouvelles règles : lecture = approuvés, écriture = admins
-- ---------------------------------------------------------------------

drop policy if exists "approved read sutures" on public.sutures;
create policy "approved read sutures" on public.sutures
  for select to authenticated
  using (private.is_approved(auth.uid()));

drop policy if exists "admins manage sutures" on public.sutures;
create policy "admins manage sutures" on public.sutures
  for all to authenticated
  using (private.has_role(auth.uid(), 'admin'::app_role))
  with check (private.has_role(auth.uid(), 'admin'::app_role));

drop policy if exists "approved read protocoles" on public.protocoles;
create policy "approved read protocoles" on public.protocoles
  for select to authenticated
  using (private.is_approved(auth.uid()));

drop policy if exists "admins manage protocoles" on public.protocoles;
create policy "admins manage protocoles" on public.protocoles
  for all to authenticated
  using (private.has_role(auth.uid(), 'admin'::app_role))
  with check (private.has_role(auth.uid(), 'admin'::app_role));

drop policy if exists "approved read suture_protocoles" on public.suture_protocoles;
create policy "approved read suture_protocoles" on public.suture_protocoles
  for select to authenticated
  using (private.is_approved(auth.uid()));

drop policy if exists "admins manage suture_protocoles" on public.suture_protocoles;
create policy "admins manage suture_protocoles" on public.suture_protocoles
  for all to authenticated
  using (private.has_role(auth.uid(), 'admin'::app_role))
  with check (private.has_role(auth.uid(), 'admin'::app_role));

commit;

-- =====================================================================
-- VÉRIFICATION (à lancer après, résultat attendu : 6 lignes,
-- 3 « SELECT » avec is_approved, 3 « ALL » avec has_role admin)
-- =====================================================================
-- select tablename, policyname, cmd, qual
-- from pg_policies
-- where tablename in ('sutures', 'protocoles', 'suture_protocoles')
-- order by tablename, cmd;

-- =====================================================================
-- RETOUR ARRIÈRE (remet l'état d'avant, donc l'état NON sécurisé)
-- =====================================================================
-- begin;
-- drop policy if exists "approved read sutures" on public.sutures;
-- drop policy if exists "admins manage sutures" on public.sutures;
-- drop policy if exists "approved read protocoles" on public.protocoles;
-- drop policy if exists "admins manage protocoles" on public.protocoles;
-- drop policy if exists "approved read suture_protocoles" on public.suture_protocoles;
-- drop policy if exists "admins manage suture_protocoles" on public.suture_protocoles;
-- create policy "all sutures" on public.sutures for all to authenticated using (true) with check (true);
-- create policy "all protocoles" on public.protocoles for all to authenticated using (true) with check (true);
-- create policy "all suture_protocoles" on public.suture_protocoles for all to authenticated using (true) with check (true);
-- commit;
