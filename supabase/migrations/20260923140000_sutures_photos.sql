-- =====================================================================
-- Module Sutures — photos des fils
-- Date : 23/09/2026
-- But : préparer le stockage des photos de fils.
--   1. Déclarer le type de contenu « sutures » (les photos sont rangées
--      dans la table commune des images, comme pour les transmissions).
--   2. Créer un espace de stockage privé « sutures ».
-- Les envois et suppressions passent par le serveur de l'appli, qui
-- vérifie le rôle admin. La lecture reste réservée aux comptes approuvés
-- (règle déjà en place sur la table des images).
-- Sans risque si relancé.
-- =====================================================================

insert into public.content_types (code, label)
values ('sutures', 'Fils de suture')
on conflict (code) do nothing;

insert into storage.buckets (id, name, public)
values ('sutures', 'sutures', false)
on conflict (id) do nothing;

-- VÉRIFICATION (résultat attendu : 1 ligne pour chaque requête)
-- select code, label from public.content_types where code = 'sutures';
-- select id, public from storage.buckets where id = 'sutures';
