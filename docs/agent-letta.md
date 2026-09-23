# Accès de l'agent Letta au module Sutures

## Principe

L'appli expose une seule adresse pour les agents :

`POST https://dbm-mac97000.lovable.app/api/public/agent`

- En-tête : `x-agent-key: <clé de l'agent>`
- Corps JSON : `{ "action": "...", "params": { ... } }`

La clé se crée et se désactive en SQL (voir la migration `20260923160000_agent_letta.sql`).
La base n'en garde qu'une empreinte.

## Règles imposées par l'appli

- L'agent ne remplit que des cases vides. Une case déjà remplie est refusée.
- L'agent ne modifie jamais la marque, le calibre, la famille ni le statut d'un fil.
- L'agent ne supprime rien, et ne modifie jamais un élément existant : il crée, ou il remplit des cases vides.
- Convention de nommage : `docs/convention-nommage-fils.md`.
- Chaque écriture est inscrite dans le journal des agents, avec l'avant et l'après.

## Actions

- `aide` : mode d'emploi renvoyé par l'appli.
- `lister_fils` : tous les fils, avec leurs cases vides et leur nombre de photos.
- `lire_fil` : `{ "id": "..." }` ou `{ "slug": "..." }`.
- `completer_fil` : `{ "id": "...", "champs": { "composition": "...", "cours": "..." } }`.
  Champs autorisés : composition, couleur, type_aiguille, longueur, reference, usage_notes, note_qualite, cours, plans.
  `plans` est une liste parmi : os, tendon_ligament, profond, sous_cutane, peau. Ex. `"plans": ["profond", "sous_cutane"]`.

## Format du cours d'un fil

Une idée par ligne, séparée par un saut de ligne (`\n`). L'appli met en forme chaque ligne :

- ligne 1 : ce qu'est le fil (affichée en accroche) ;
- une ligne qui parle du sachet (« Le sachet… ») : affichée sous « Le reconnaître » ;
- une ligne sur l'usage au bloc (« Au bloc, il sert… ») : affichée sous « Au bloc » ;
- une ligne sur la résorption ou le retrait : affichée sous « Dans l'organisme » ;
- une ligne « Piège : … » : affichée en encadré d'alerte ;
- dernière ligne « Source : … » : affichée en petit, en bas.
- `ajouter_photo` : `{ "id": "...", "url": "https://...", "source": "d'où vient l'image" }`. 6 photos au maximum par fil.
- `trouver_fil` : `{ "nom": "Polysorb 2/0 petite aiguille" }` → correspondances exactes puis proches (noms des fils et noms de terrain).
- `ajouter_nom_terrain` : `{ "id": "<fil>", "nom": "...", "source": "fiche de picking + phrase" }`.
- `creer_fil` : `{ "marque": "POLYSORB 3/0", "calibre": "3/0", "famille": "resorbable_tresse", "source": "...", "champs": { ... } }`.
- `lister_protocoles`, `lire_protocole` (`{ "id" }` ou `{ "slug" }`).
- `creer_protocole` : `{ "nom": "...", "source": "...", "region": "...", "description": "..." }`.
- `creer_lien` : `{ "fil_id", "protocole_id", "source", "quantite", "plan", "disponibilite": "a_sortir" | "a_la_demande", "note" }`.
- `completer_lien` : `{ "fil_id", "protocole_id", "champs": { "quantite", "plan", "disponibilite", "note" } }` — cases vides seulement.
- `lister_chirurgiens`, `creer_chirurgien` (`{ "nom", "source", "initiales", "specialite" }`).
- `lier_chirurgien` : `{ "fil_id", "chirurgien_id", "source", "note" }` — seulement quand un fil est propre à un chirurgien.
- `lire_formation` : contenu de la formation, bloc par bloc.

Tout ce que Letta crée porte l'étiquette « à valider », visible tout de suite dans l'appli. Un admin la retire d'un clic.
- `completer_formation` :
  - remplir un bloc vide : `{ "bloc_id": "...", "points": ["...", "..."] }`
  - ajouter un bloc : `{ "etape": "motivation" | "explication" | "methode", "titre": "...", "points": ["..."] }`

## Outil à créer dans Letta

Nom de l'outil : `dbm_sutures`. Variable d'environnement de l'outil : `DBM_AGENT_KEY` = la clé créée en SQL.

```python
def dbm_sutures(action: str, params: dict = None) -> str:
    """
    Lit et complète le module Sutures de l'appli Des Blocs & Moi.
    Commence toujours par l'action "aide" pour connaître les règles.

    Args:
        action (str): aide, lister_fils, lire_fil, completer_fil, ajouter_photo, lire_formation ou completer_formation.
        params (dict): paramètres de l'action, voir l'action "aide".

    Returns:
        str: réponse JSON de l'appli.
    """
    import os
    import requests

    response = requests.post(
        "https://dbm-mac97000.lovable.app/api/public/agent",
        headers={"x-agent-key": os.environ["DBM_AGENT_KEY"]},
        json={"action": action, "params": params or {}},
        timeout=60,
    )
    return response.text
```
