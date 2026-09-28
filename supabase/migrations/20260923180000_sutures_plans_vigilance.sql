-- =====================================================================
-- Module Sutures — plans de suture + nettoyage des points de vigilance
-- Date : 23/09/2026
--   1. Nouvelle case « plans » sur chaque fil : où il est utilisé
--      (os, tendon_ligament, profond, sous_cutane, peau). Vide au départ :
--      Letta ou un admin la remplit.
--   2. Vidage des points de vigilance périmés (codes internes « A1… »,
--      mentions « NON DÉFINI », comptages de lignes de picking).
--      L'ancien texte est gardé dans le journal. Letta pourra réécrire.
-- Sans risque si relancé.
-- =====================================================================

begin;

alter table public.sutures add column if not exists plans text[];

with perimes as (
  select id, marque, note_qualite
  from public.sutures
  where note_qualite ~* '(⚠ ?A[0-9]+|NON D[ÉE]FINI|lignes de picking|source terrain)'
), trace as (
  insert into public.agent_journal (agent, action, table_cible, ligne_id, champ, avant, apres)
  select 'Manu (nettoyage)', 'vider_vigilance', 'sutures', id, 'note_qualite', note_qualite, null
  from perimes
), vide as (
  update public.sutures s
  set note_qualite = null
  from perimes p
  where s.id = p.id
  returning s.id
)
select p.marque as fil, p.note_qualite as ancien_point_de_vigilance
from perimes p
order by p.marque;

commit;
