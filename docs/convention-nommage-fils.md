# Convention de nommage des fils de suture — Des Blocs & Moi

Établie le 23/09/2026. Source des noms variables : fiches de picking Word (saisies humaines, « écrit comme on parle »).
Objectif : remplacer toutes les variantes par un nom canonique unique.

## Convention

**Format canonique : `MARQUE CALIBRE [Aiguille <courbure> <longueur mm>]`**

- MARQUE : nom du fabricant/produit en MAJUSCULES (ex. DAFILON, POLYSORB, VICRYL RAPIDE).
- CALIBRE : le calibre réel du produit, tel qu'il est imprimé sur la boîte.
  - Fil : format USP avec « /0 » (ex. 2/0, 3/0, 0, 2, 5). Une écriture humaine comme « 2-0 » ou « 1-0 » exprime « 2/0 » ou « 1/0 » : on corrige l'écriture, sans rien inventer.
  - Ruban (tape) ou boucle : la largeur en millimètres, avec une virgule (ex. « 2,2 mm »).
  - En cas de doute : on demande, puis on fixe la convention.
- Aiguille : seulement si elle distingue deux fiches du même fil (ex. DAFILON 2/0 existe en 21 mm et 30 mm).
- Raccourcis humains à éliminer : PA / GA (petite / grande aiguille), « aig », « aig droite », « grande aiguille », « petite aiguille », fautes (Vycril, Polysord, Mersuture).
- Agrafeuse : dans les anciennes fiches, « Agrafeuse » seule désigne le modèle par défaut, la 35W. La 35R était toujours précisée. Désormais, la taille est toujours écrite.

## Table de correspondance (fiche de picking → nom canonique)

| Écrit dans les fiches | Nom canonique | Fiche du fil dans l'appli |
|---|---|---|
| Vicryl rapide 3/0 · Vycril rapide 3/0 | VICRYL RAPIDE 3/0 | vicryl-rapide-3-0 |
| Vicryl rapide 4/0 | VICRYL RAPIDE 4/0 | vicryl-rapide-4-0 |
| Vicryl 2-0 (J459) | VICRYL 2/0 | vicryl-2-0 |
| Polysorb 3/0 · Polysord 3/0 | POLYSORB 3/0 (fiche à créer) | — |
| Polysorb 2 grande aiguille | POLYSORB 2 | polysorb-2 |
| Polysorb 0 CL927 · Polysorb 0 PA 36 | POLYSORB 0 | polysorb-0 |
| Polysorb 2/0 SL612 · Polysorb 2/0 petite aiguille | POLYSORB 2/0 | polysorb-2-0 |
| Polysorb 1 CL-918 · Polysorb 1-0 | POLYSORB 1/0 (CL-918) | — |
| HS 2 | HS FIBER 2 | hs-fiber-2 |
| HS 5 | HS FIBER 5 | hs-fiber-5 |
| Dafilon 3/0 aig 24 | DAFILON 3/0 (AIG 24MM) | dafilon-3-0-aig-24 |
| Dafilon 2/0 aig 30 | DAFILON 2/0 (AIG 30MM) | dafilon-2-0-aig-30 |
| Dafilon 2/0 (Aig 21mm) · Dafilon 2/0 (pour le redon) · Flexo 2.5 · Flexocrin 2,5 · Flexo 2/0 | DAFILON 2/0 | dafilon-2-0-aig-21 |
| Prémicron 1 aig droite | PREMICRON 1 aiguille droite | premicron-aig-droite |
| PDS 3/0 | PDS II 3/0 | pds-2-3-0 |
| Mersuture ×3 | MERSILENE 3 | mersilene-3 |
| HS Fiber 2 ×1 | HS FIBER 2 | hs-fiber-2 |
| Monocryl 3/0 | MONOCRYL 3/0 | monocryl-3-0 |
| Agrafeuse (sans taille) | AGRAFEUSE CUTANÉE 35W | agrafeuse-35w |
| Agrafeuse 35R | AGRAFEUSE CUTANÉE 35R | agrafeuse-35r |

## Stock HS FIBER (Riverpoint Medical LLC, distribué par Ortho AM Medical GmbH)

« HS » dans les fiches de picking = HS FIBER.

| Produit | Référence | Fiche du fil |
|---|---|---|
| HS FIBER 2 | HS158 | hs-fiber-2 |
| HS FIBER 5 | HS502 | hs-fiber-5 |
| HS FIBER TAPE 2,2 mm | HS523 | hs-fiber-tape-2-2-mm |
| HS FIBER LOOP 2,2 mm | HS524 | hs-fiber-loop-2-2-mm |
| SutUp | HS1002-MU, HS1013-MU, HS134-MU, HS959-MU, HS960-MU | sutup-… |

## Fils hors service

- FLEXOCRIN (B. Braun, polyamide monobrin bleu, non résorbable ; ancien nom du Dafilon) : hors service, remplacé par ses équivalents Dafilon.
  - « Flexo 2.5 », « Flexo 2,5 », « Flexocrin 2,5 » (USP 2/0) → DAFILON 2/0 aiguille 21 mm (dafilon-2-0-aig-21).
  - « Flexo 2/0 » → DAFILON 2/0 aiguille 1/2 cercle 21 mm (dafilon-2-0-aig-21), habitude du chirurgien.

HS FIBER 0 : produit arrêté. Ne pas le remplacer : attendre l'équivalence fournie par le chirurgien.

## Fils propres à un chirurgien

- VICRYL RAPIDE 3/0 : essentiellement Dr Dotzis.
- VICRYL RAPIDE 4/0 : essentiellement Dr Chrosciany.

## Vocabulaire

- **Fiche de picking** : document Word ou papier saisi au bloc.
- **Fiche du fil** : page d'un fil dans l'appli.
- **Protocole opératoire** : l'intervention, dans l'appli.
