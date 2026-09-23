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
- L'agent ne supprime rien.
- Chaque écriture est inscrite dans le journal des agents, avec l'avant et l'après.

## Actions

- `aide` : mode d'emploi renvoyé par l'appli.
- `lister_fils` : tous les fils, avec leurs cases vides et leur nombre de photos.
- `lire_fil` : `{ "id": "..." }` ou `{ "slug": "..." }`.
- `completer_fil` : `{ "id": "...", "champs": { "composition": "...", "cours": "..." } }`.
  Champs autorisés : composition, couleur, type_aiguille, longueur, reference, usage_notes, note_qualite, cours.
- `ajouter_photo` : `{ "id": "...", "url": "https://...", "source": "d'où vient l'image" }`. 6 photos au maximum par fil.
- `lire_formation` : contenu de la formation, bloc par bloc.
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
