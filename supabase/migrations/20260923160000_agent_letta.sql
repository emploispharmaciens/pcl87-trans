-- =====================================================================
-- Accès de l'agent Letta au module Sutures
-- Date : 23/09/2026
-- Contenu :
--   1. Clés d'accès des agents (rangées sous forme illisible).
--   2. Journal de toutes les écritures faites par un agent.
--   3. Contenu de la formation, déplacé du code vers la base.
--   4. Colonne « source » sur les photos (d'où vient l'image).
-- Règle de départ : un agent ne remplit que des cases vides.
-- Sans risque si relancé.
-- =====================================================================

begin;

-- 1. Clés d'accès ------------------------------------------------------
create table if not exists public.agent_cles (
  id           uuid primary key default gen_random_uuid(),
  nom          text not null,
  cle_hash     text not null unique,
  actif        boolean not null default true,
  created_at   timestamptz not null default now(),
  last_used_at timestamptz
);
alter table public.agent_cles enable row level security;
-- Aucune règle d'accès : seul le serveur de l'appli lit cette table.

-- 2. Journal des écritures des agents ---------------------------------
create table if not exists public.agent_journal (
  id          uuid primary key default gen_random_uuid(),
  agent       text not null,
  action      text not null,
  table_cible text not null,
  ligne_id    uuid,
  champ       text,
  avant       text,
  apres       text,
  created_at  timestamptz not null default now()
);
create index if not exists agent_journal_created_idx on public.agent_journal (created_at desc);
alter table public.agent_journal enable row level security;
drop policy if exists "admins read agent_journal" on public.agent_journal;
create policy "admins read agent_journal" on public.agent_journal
  for select to authenticated
  using (private.has_role(auth.uid(), 'admin'::app_role));

-- 3. Contenu de la formation -----------------------------------------
create table if not exists public.formation_blocs (
  id         uuid primary key default gen_random_uuid(),
  module     text not null default 'sutures',
  etape      text not null check (etape in ('motivation', 'explication', 'methode')),
  ordre      integer not null default 100,
  titre      text not null,
  points     text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists formation_blocs_ordre_idx on public.formation_blocs (module, etape, ordre);
alter table public.formation_blocs enable row level security;

drop policy if exists "approved read formation_blocs" on public.formation_blocs;
create policy "approved read formation_blocs" on public.formation_blocs
  for select to authenticated
  using (private.is_approved(auth.uid()));

drop policy if exists "admins manage formation_blocs" on public.formation_blocs;
create policy "admins manage formation_blocs" on public.formation_blocs
  for all to authenticated
  using (private.has_role(auth.uid(), 'admin'::app_role))
  with check (private.has_role(auth.uid(), 'admin'::app_role));

drop trigger if exists touch_formation_blocs_updated_at on public.formation_blocs;
create trigger touch_formation_blocs_updated_at
  before update on public.formation_blocs
  for each row execute function public.touch_updated_at();

-- Contenu actuel, inséré seulement si la table est vide.
insert into public.formation_blocs (module, etape, ordre, titre, points)
select * from (values
  ('sutures', 'motivation', 10, 'Ce qui se joue au champ', array['Un fil ouvert par erreur est un fil jeté.', 'Le chirurgien attend pendant qu''on cherche le bon.', 'Un fil trop fin ou trop gros fragilise la réparation.', '« 2 » et « 2/0 » se ressemblent sur une liste, mais ce sont deux fils opposés.']::text[]),
  ('sutures', 'motivation', 20, 'Ce que tu sauras faire', array['Lire un sachet en dix secondes.', 'Reconnaître la famille d''un fil et savoir à quoi elle sert.', 'Préparer les fils d''une intervention avant qu''on te les demande.']::text[]),
  ('sutures', 'explication', 10, '1. Résorbable ou non résorbable', array['Résorbable : l''organisme dégrade le fil. Il n''y a rien à retirer.', 'Non résorbable : le fil reste en place. En surface, on le retire après cicatrisation.', 'La durée de résorption dépend du fil : elle est indiquée par le fabricant.']::text[]),
  ('sutures', 'explication', 20, '2. Monobrin ou tressé', array['Monobrin : un seul brin lisse. Il glisse bien dans les tissus.', 'Tressé : plusieurs brins entrelacés. Il est souple et le nœud tient bien.', 'Un monobrin a de la « mémoire » : il garde sa forme d''emballage et demande plus de nœuds.']::text[]),
  ('sutures', 'explication', 30, '3. Le calibre', array['Le calibre, c''est l''épaisseur du fil.', '« 0 » est le point de repère.', 'Avec « /0 », plus le chiffre monte, plus le fil est fin : 4/0 est plus fin que 2/0.', 'Sans « /0 », plus le chiffre monte, plus le fil est gros : 2 est plus gros que 1.', 'Piège : « 2 » est un gros fil, « 2/0 » est un fil fin.', 'Le sachet porte aussi un chiffre métrique. Ne le confonds pas avec le calibre.']::text[]),
  ('sutures', 'explication', 40, '4. L''aiguille', array['La courbure s''écrit en fraction de cercle : 3/8, 1/2. Certaines aiguilles sont droites.', 'La longueur s''écrit en millimètres : 16 mm, 26 mm, 48 mm…', 'Une pointe ronde écarte les tissus sans les couper.', 'Une pointe tranchante coupe : elle sert pour les tissus résistants.', '« TAPER » désigne une pointe ronde.', 'Les autres abréviations (TR, RDE, RPA…) varient selon le fabricant : lis la légende de la boîte.']::text[]),
  ('sutures', 'explication', 50, '5. Les familles particulières', array['Haute résistance : fils ou rubans très solides, pour réinsérer un tendon ou un ligament.', 'Fil cranté : de petites dents le bloquent dans les tissus, sans nœud.', 'Résorption rapide : pour les sutures qui doivent disparaître vite.', 'Agrafes cutanées : deux modèles d''agrafeuse ne sont pas interchangeables.']::text[]),
  ('sutures', 'methode', 10, 'Lire un sachet en dix secondes', array['1. La marque et la matière.', '2. Le calibre : cherche « /0 » ou son absence.', '3. L''aiguille : courbure, longueur, pointe.', '4. La longueur du fil.', '5. La référence, la date de péremption et l''état de l''emballage.']::text[]),
  ('sutures', 'methode', 20, 'Avant d''ouvrir', array['Vérifie la demande : fil, calibre et aiguille.', 'Annonce le fil à voix haute avant de l''ouvrir.', 'Contrôle la date de péremption et l''intégrité de l''emballage.', 'Ouvre en respectant l''asepsie.']::text[]),
  ('sutures', 'methode', 30, 'Pendant et après', array['Compte les aiguilles sorties, comme les compresses.', 'Récupère chaque aiguille rendue par le chirurgien.', 'Élimine les aiguilles dans le collecteur prévu.']::text[]),
  ('sutures', 'methode', 40, 'Anticiper', array['Ouvre l''onglet « Interventions » la veille ou avant l''installation.', 'Prépare les fils listés pour l''intervention du jour.', 'Garde les quantités indiquées : elles viennent des habitudes du bloc.']::text[])
) as v(module, etape, ordre, titre, points)
where not exists (select 1 from public.formation_blocs where module = 'sutures');

-- 4. Source des photos -------------------------------------------------
alter table public.content_images add column if not exists source text;

commit;

-- =====================================================================
-- CRÉER LA CLÉ DE LETTA (à lancer séparément, une seule fois)
-- Le résultat affiche la clé en clair UNE SEULE FOIS : copie-la
-- dans la configuration de Letta. La base n'en garde qu'une empreinte.
-- =====================================================================
-- with k as (
--   select replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '') as cle
-- ), ins as (
--   insert into public.agent_cles (nom, cle_hash)
--   select 'Letta', encode(sha256(convert_to(cle, 'UTF8')), 'hex') from k
--   returning id
-- )
-- select k.cle as cle_a_copier from k, ins;

-- DÉSACTIVER LA CLÉ DE LETTA
-- update public.agent_cles set actif = false where nom = 'Letta';

-- LIRE LE JOURNAL DES ÉCRITURES
-- select created_at, agent, action, table_cible, champ, avant, apres
-- from public.agent_journal order by created_at desc limit 50;
