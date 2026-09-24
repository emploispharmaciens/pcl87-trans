-- =====================================================================
-- Module Sutures — FLEXOCRIN hors service
-- Date : 24/09/2026
-- Arbitrage de Manu : FLEXOCRIN est hors service, remplacé par ses
-- équivalents Dafilon. La fiche reste visible, avec le badge
-- « Retiré du service ». Sans risque si relancé.
-- =====================================================================
update public.sutures
set statut = 'retire',
    note_qualite = 'Hors service : remplacé par ses équivalents Dafilon.'
where slug = 'flexocrin';

-- Vérification
-- select marque, statut, note_qualite from public.sutures where slug = 'flexocrin';
