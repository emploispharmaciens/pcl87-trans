-- Niveaux de clé d'agent : « completer » (par défaut) et « corriger ».
-- « corriger » ajoute deux actions : corriger_fil et supprimer_photo.
begin;
alter table public.agent_cles
  add column if not exists niveau text not null default 'completer';
alter table public.agent_cles drop constraint if exists agent_cles_niveau_check;
alter table public.agent_cles
  add constraint agent_cles_niveau_check check (niveau in ('completer', 'corriger'));
update public.agent_cles set niveau = 'corriger' where nom = 'Claude-photos';
commit;

-- Changer le niveau d'une clé :
-- update public.agent_cles set niveau = 'corriger' where nom = '<nom>';
