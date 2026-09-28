-- =====================================================================
-- Module Sutures — phase 4a : fondations des liens
-- Date : 23/09/2026
--   1. Chirurgiens.
--   2. Liens fil ↔ protocole opératoire enrichis : plan, « à sortir » ou
--      « à la demande », étiquette « à valider », source.
--   3. Liens d'exception fil ↔ chirurgien.
--   4. Noms de terrain des fils (écritures des fiches de picking).
--   5. Étiquette « à valider » sur les fils et protocoles créés par Letta.
--   6. Reprise : « à la demande » repris des notes existantes, noms de
--      terrain de la convention du 23/09, deux fils propres à un chirurgien.
-- Sans risque si relancé.
-- =====================================================================

begin;

-- 1. Chirurgiens --------------------------------------------------------
create table if not exists public.chirurgiens (
  id         uuid primary key default gen_random_uuid(),
  nom        text not null unique,
  initiales  text,
  specialite text,
  actif      boolean not null default true,
  a_valider  boolean not null default false,
  source     text,
  created_at timestamptz not null default now()
);

-- 2. Liens fil ↔ protocole opératoire ------------------------------------
alter table public.suture_protocoles add column if not exists plan text;
alter table public.suture_protocoles add column if not exists disponibilite text;
alter table public.suture_protocoles add column if not exists a_valider boolean not null default false;
alter table public.suture_protocoles add column if not exists source text;
alter table public.suture_protocoles add column if not exists created_at timestamptz not null default now();

alter table public.suture_protocoles drop constraint if exists suture_protocoles_plan_check;
alter table public.suture_protocoles add constraint suture_protocoles_plan_check
  check (plan is null or plan in ('os', 'tendon_ligament', 'profond', 'sous_cutane', 'peau'));
alter table public.suture_protocoles drop constraint if exists suture_protocoles_disponibilite_check;
alter table public.suture_protocoles add constraint suture_protocoles_disponibilite_check
  check (disponibilite is null or disponibilite in ('a_sortir', 'a_la_demande'));

-- 3. Liens fil ↔ chirurgien ----------------------------------------------
create table if not exists public.suture_chirurgiens (
  suture_id     uuid not null references public.sutures(id) on delete cascade,
  chirurgien_id uuid not null references public.chirurgiens(id) on delete cascade,
  note          text,
  a_valider     boolean not null default false,
  source        text,
  created_at    timestamptz not null default now(),
  primary key (suture_id, chirurgien_id)
);

-- 4. Noms de terrain -------------------------------------------------------
create table if not exists public.suture_noms (
  id         uuid primary key default gen_random_uuid(),
  suture_id  uuid not null references public.sutures(id) on delete cascade,
  nom        text not null,
  source     text,
  created_at timestamptz not null default now()
);
create unique index if not exists suture_noms_nom_unique on public.suture_noms (lower(nom));

-- 5. Étiquettes « à valider » ---------------------------------------------
alter table public.sutures add column if not exists a_valider boolean not null default false;
alter table public.protocoles add column if not exists a_valider boolean not null default false;
alter table public.protocoles add column if not exists source text;

-- Règles d'accès : lecture = comptes approuvés, écriture = admins --------
alter table public.chirurgiens enable row level security;
alter table public.suture_chirurgiens enable row level security;
alter table public.suture_noms enable row level security;

drop policy if exists "approved read chirurgiens" on public.chirurgiens;
create policy "approved read chirurgiens" on public.chirurgiens
  for select to authenticated using (private.is_approved(auth.uid()));
drop policy if exists "admins manage chirurgiens" on public.chirurgiens;
create policy "admins manage chirurgiens" on public.chirurgiens
  for all to authenticated
  using (private.has_role(auth.uid(), 'admin'::app_role))
  with check (private.has_role(auth.uid(), 'admin'::app_role));

drop policy if exists "approved read suture_chirurgiens" on public.suture_chirurgiens;
create policy "approved read suture_chirurgiens" on public.suture_chirurgiens
  for select to authenticated using (private.is_approved(auth.uid()));
drop policy if exists "admins manage suture_chirurgiens" on public.suture_chirurgiens;
create policy "admins manage suture_chirurgiens" on public.suture_chirurgiens
  for all to authenticated
  using (private.has_role(auth.uid(), 'admin'::app_role))
  with check (private.has_role(auth.uid(), 'admin'::app_role));

drop policy if exists "approved read suture_noms" on public.suture_noms;
create policy "approved read suture_noms" on public.suture_noms
  for select to authenticated using (private.is_approved(auth.uid()));
drop policy if exists "admins manage suture_noms" on public.suture_noms;
create policy "admins manage suture_noms" on public.suture_noms
  for all to authenticated
  using (private.has_role(auth.uid(), 'admin'::app_role))
  with check (private.has_role(auth.uid(), 'admin'::app_role));

-- 6. Reprise ---------------------------------------------------------------

-- « à la demande » écrit dans la note d'un lien existant.
update public.suture_protocoles
set disponibilite = 'a_la_demande'
where disponibilite is null and note ilike '%à la demande%';

-- Noms de terrain de la convention de nommage du 23/09/2026.
insert into public.suture_noms (suture_id, nom, source)
select s.id, v.nom, 'Convention de nommage du 23/09/2026'
from (values
  ('vicryl-rapide-3-0', 'Vicryl rapide 3/0'),
  ('vicryl-rapide-3-0', 'Vycril rapide 3/0'),
  ('vicryl-rapide-4-0', 'Vicryl rapide 4/0'),
  ('vicryl-2-0', 'Vicryl 2-0'),
  ('vicryl-2-0', 'Vicryl 2-0 (J459)'),
  ('polysorb-2', 'Polysorb 2 grande aiguille'),
  ('polysorb-0', 'Polysorb 0 CL927'),
  ('polysorb-0', 'Polysorb 0 PA 36'),
  ('polysorb-2-0', 'Polysorb 2/0 SL612'),
  ('polysorb-2-0', 'Polysorb 2/0 petite aiguille'),
  ('dafilon-3-0-aig-24', 'Dafilon 3/0 aig 24'),
  ('dafilon-2-0-aig-30', 'Dafilon 2/0 aig 30'),
  ('dafilon-2-0-aig-21', 'Dafilon 2/0 (Aig 21mm)'),
  ('dafilon-2-0-aig-21', 'Dafilon 2/0 (pour le redon)'),
  ('premicron-aig-droite', 'Prémicron 1 aig droite'),
  ('pds-2-3-0', 'PDS 3/0'),
  ('mersilene-3', 'Mersuture'),
  ('hs-fiber-2', 'HS Fiber 2'),
  ('monocryl-3-0', 'Monocryl 3/0'),
  ('agrafeuse-35w', 'Agrafeuse'),
  ('agrafeuse-35r', 'Agrafeuse 35R')
) as v(slug, nom)
join public.sutures s on s.slug = v.slug
on conflict do nothing;

-- Chirurgiens et fils propres à un chirurgien, donnés par Manu.
insert into public.chirurgiens (nom, source) values
  ('Dr LOUISIA', 'Fiches de picking d''origine du module'),
  ('Dr Dotzis', 'Manu, 23/09/2026'),
  ('Dr Chrosciany', 'Manu, 23/09/2026')
on conflict (nom) do nothing;

insert into public.suture_chirurgiens (suture_id, chirurgien_id, note, source)
select s.id, c.id, v.note, 'Manu, 23/09/2026'
from (values
  ('vicryl-rapide-3-0', 'Dr Dotzis', 'Utilisé essentiellement par ce chirurgien'),
  ('vicryl-rapide-4-0', 'Dr Chrosciany', 'Utilisé essentiellement par ce chirurgien')
) as v(slug, chirurgien, note)
join public.sutures s on s.slug = v.slug
join public.chirurgiens c on c.nom = v.chirurgien
on conflict do nothing;

commit;

-- VÉRIFICATION
-- select count(*) as noms_de_terrain from public.suture_noms;              -- 21 attendus
-- select count(*) as a_la_demande from public.suture_protocoles where disponibilite = 'a_la_demande';
-- select nom from public.chirurgiens order by nom;                          -- 3 attendus
