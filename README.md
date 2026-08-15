# Bloc Notes

BRIEF LOVABLE — Module Transmissions (DB&M)

Ce document est un brief fonctionnel à fournir à Lovable. Il décrit QUOI construire, pas COMMENT le stocker. Lovable crée son propre modèle de données. Aucun DDL imposé. Aucun nom de table imposé. Aucun nom de colonne imposé.

1. CONTEXTE PRODUIT

L'application

DB&M (Des Blocs & Moi) est une plateforme de gestion des savoirs pour les équipes de bloc opératoire en chirurgie orthopédique. Elle est composée de modules indépendants (transmissions, glossaire, thesaurus, picking, arsenal…).

Ce module

Transmissions = le journal de relève entre les équipes du bloc opératoire.

Quand une équipe (matin) passe le relais à la suivante (après-midi, nuit, garde), elle transmet les informations critiques : pannes matériel, consignes spécifiques, alertes sécurité, rappels organisationnels. Aujourd'hui c'est un cahier papier ou de l'oral. Ce module le numérise.

C'est le module le plus quotidien de DB&M. Un soignant ouvre, écrit, publie. L'équipe suivante lit.

Public cible

Des soignants de bloc opératoire : infirmiers (IDE), infirmiers de bloc (IBODE), aides-soignants, cadres. Pas des développeurs. Pas des informaticiens. Le vocabulaire doit être simple, les actions évidentes.

Persona principal — « Julie » : nouvelle arrivante au bloc, 6 mois de poste. Elle n'ose pas poser de questions à l'équipe. Elle a besoin que l'info soit là, accessible, sans qu'elle ait à demander. Phrases ≤ 12 mots dans l'interface. Zéro jargon technique. Ton rassurant.

2. AUTHENTIFICATION & ACCÈS

Auth Google

Connexion via Google uniquement. Un soignant clique « Se connecter avec Google », autorise, et arrive dans l'app.

Page d'attente (CRITIQUE)

Après la première connexion Google, le compte est créé MAIS non approuvé. L'utilisateur arrive sur une page d'attente qui dit :

« Votre compte a bien été créé. Un administrateur doit valider votre accès avant que vous puissiez consulter les transmissions. Vous recevrez un e-mail dès que votre accès sera activé. »

Le soignant ne voit rien d'autre tant qu'il n'est pas approuvé. Pas de liste vide. Pas de module grisé. Une page d'attente claire avec son nom et son email affichés.

Validation admin

Un administrateur voit la liste des comptes en attente dans un écran d'administration. Il peut :

Approuver → le soignant a accès au module

Refuser → le compte reste bloqué (avec un motif optionnel)

Retirer l'accès → un compte déjà approuvé peut être désactivé

4 niveaux d'accès

Niveau Qui Peut faire Non approuvé Nouveau compte Google Voir la page d'attente uniquement Membre Soignant approuvé Lire toutes les transmissions publiées + créer/modifier/archiver les siennes Modérateur Soignant de confiance Tout ce que Membre fait + voir les brouillons de tous + archiver celles des autres Admin Administrateur Tout + supprimer + gérer les comptes + voir les stats + exporter

3. ARCHITECTURE API (CRITIQUE)

Ce module est le premier d'une série

D'autres modules DB&M seront construits séparément et devront consommer les données de ce module via API. Le modèle de données doit donc être pensé pour l'interopérabilité dès le départ.

Exigences API

Chaque entité doit être accessible via l'API REST Supabase (PostgREST automatique) — pas besoin d'endpoints custom pour le CRUD de base

Les relations entre entités doivent être navigables via l'API (ex : récupérer une transmission avec ses images et ses tags en une seule requête)

La table des utilisateurs/profils doit être réutilisable par les modules suivants (glossaire, thesaurus, picking…) — c'est la même base de soignants

Le système de catégories et de tags doit être générique — les modules suivants auront aussi des catégories et des tags, avec un mécanisme de lien polymorphe ou par type

Les policies RLS (Row Level Security) doivent protéger chaque table selon les 4 niveaux d'accès

Modules suivants prévus (pour info — ne pas construire maintenant)

Glossaire : dictionnaire de termes chirurgicaux

Thesaurus : catalogue d'interventions chirurgicales

Arsenal : inventaire du matériel et des locaux du bloc

Picking : fiches de préparation de salle opératoire

Tous consommeront la même base utilisateurs, le même système de catégories/tags, les mêmes RLS.

4. FEATURES FONCTIONNELLES

4.1 — Liste des transmissions (écran principal)

L'écran principal affiche la liste des transmissions sous forme de cartes empilées, les plus récentes en premier.

Chaque carte affiche :

Avatar de l'auteur (photo Google ou cercle avec initiales, 40×40 px)

Nom de l'auteur + temps relatif (« il y a 3 h »)

Titre (gras)

Extrait du contenu (150 caractères max, texte brut)

Badge catégorie (couleur définie par la catégorie)

Badge « Prioritaire » (rouge, si activé)

Badge « Essentiel » (jaune, si type = essentiel)

Badge nombre d'images (si > 0)

Tags (max 3 affichés, « +N » si plus)

Cliquer sur une carte ouvre le détail (voir 4.3).

4.2 — Barre de filtres

Au-dessus de la liste, une barre horizontale avec :

Recherche texte (titre + contenu)

Filtre catégorie (dropdown)

Filtre statut : Actives (défaut) / Archivées

Filtre type : Tous / Essentielles / Libres

Bouton Prioritaires (toggle on/off, icône flamme)

Bouton « Nouvelle transmission » (visible seulement si membre approuvé ou plus)

4.3 — Détail d'une transmission (modale ou page)

Ouvre le contenu complet :

En-tête : avatar + nom auteur + date complète

Badges : catégorie, prioritaire, essentiel

Images : affichées en grille. Clic = vue plein écran (lightbox)

Contenu : HTML riche rendu (gras, italique, listes)

Tags : tous affichés

Actions (si auteur ou admin) : Modifier / Archiver / Supprimer

4.4 — Formulaire de saisie (modale)

Champs :

Titre (obligatoire, 3-100 caractères)

Contenu (obligatoire, éditeur texte riche, min 10 caractères en texte brut). Fonctions : gras, italique, souligné, liste à puces, liste numérotée

Catégorie (obligatoire, dropdown)

Type : Libre (défaut) ou Essentiel

Prioritaire (toggle switch, icône flamme)

Images (optionnel, max 3, max 5 Mo chacune, drag & drop + bouton sélection, barre de progression)

Tags (optionnel, max 5, recherche + sélection parmi tags existants)

4.5 — Statistiques (portail)

4 compteurs affichés en haut de page (cards horizontales) :

Actives : nombre de transmissions avec statut « ouvert »

Prioritaires : nombre de transmissions ouvertes et prioritaires

Essentielles : nombre de transmissions ouvertes de type « essentiel » (afficher « N/20 » — jauge)

Archivées : nombre total archivées

4.6 — Administration

Page admin séparée, accessible uniquement aux admins. 3 onglets :

Onglet 1 — Toutes les transmissions Tableau avec colonnes : Titre / Auteur / Catégorie / Statut / Date / Action (preview) Filtres : statut, catégorie, recherche L'admin peut prévisualiser et supprimer définitivement

Onglet 2 — Stats 4 KPIs : Total / Publiées / Brouillons / Données dev

Onglet 3 — Export Export CSV de toutes les transmissions (titre, statut, catégorie, date, auteur). Le contenu texte n'est PAS exporté (RGPD). Format : CSV avec séparateur point-virgule, encodage UTF-8 BOM (pour Excel)

Onglet 4 — Gestion des comptes (spécifique à cette app) Liste des comptes avec statut (en attente / approuvé / refusé / désactivé) Boutons : Approuver / Refuser / Désactiver

4.7 — Actions sur une transmission

Action Qui peut Effet Créer Membre+ Crée avec statut « ouvert » Modifier Auteur ou Admin Met à jour titre, contenu, images, tags, priorité, type Archiver Auteur ou Admin Passe le statut à « archivé » — réversible Supprimer (douce) Auteur ou Modérateur Passe le statut à « supprimé » — invisible mais en base. Restaurable par admin Supprimer (définitive) Admin uniquement Supprime vraiment de la base

5. CHARTE VISUELLE — CDS (Charte De Style DB&M)

IMPÉRATIF

Cette app sera la première d'une série de modules. Tous les modules suivants doivent avoir la même identité visuelle. Les choix faits ici font jurisprudence.

Système de couleur par module

Chaque module DB&M a sa propre couleur, déclinée en 4 variantes CSS :

/* Transmissions = bleu ciel */
--module-color: #93c5fd;         /* Fond léger, badges */
--module-color-strong: #60a5fa;  /* Accents, boutons, avatars */
--module-color-text: #1e3a8a;    /* Texte sur fond module */
--module-color-soft: rgba(147, 197, 253, 0.15);  /* Arrière-plan très léger */


Ces 4 variables pilotent : la bannière de page, les boutons principaux, les badges, les avatars par défaut, les accents de carte. Le reste de l'UI utilise les couleurs neutres du système (gris, blanc, noir).

Typographie

Police : system-ui nativement (la police du système de l'utilisateur). Zéro Google Fonts. Zéro Inter. Zéro Rubik.

Tailles : h1 gras pour le titre de page, h6/fw-semibold pour les titres de cartes, 0.9375rem pour le contenu prose, small / 0.7rem pour les métadonnées

Icônes

Bootstrap Icons uniquement (via CDN ou équivalent React).

Zéro Font Awesome. Zéro Flaticon. Zéro icônes custom.

Icône du module Transmissions : bi-chat-square-text

Composants visuels

Bannière de page Un bloc pleine largeur en haut de page avec le dégradé module-color → module-color-strong. Contient le titre du module (h1 + icône) et un sous-titre (opacité 0.75). Texte en module-color-text (bleu foncé sur fond bleu clair).

Cartes Fond blanc, ombre légère (shadow-sm), coins arrondis, hover avec ombre renforcée + léger translateY(-1px). Pas de bordure visible sauf cas spécifique (prioritaire = bordure gauche rouge 3px).

Barre de filtres Fond blanc/neutre, bordure 1px, coins arrondis 0.5rem, padding interne, marge sous la barre. Tous les filtres sur une seule ligne horizontale (responsive : wrap sur mobile).

Modales Centrées, coins arrondis 1rem, ombre forte, pas de bordure visible. Header avec fond module-color. Footer avec boutons alignés. Responsive : plein écran sur mobile (modal-fullscreen-md-down).

Avatars Cercle 40×40 px. Si photo Google disponible : object-fit: cover. Sinon : cercle fond module-color-strong avec initiales en blanc, font-size: 0.8rem, font-weight: bold.

Badges Petits, arrondis. Catégorie : bordure de la couleur catégorie + texte même couleur, fond transparent. Prioritaire : fond rouge, texte blanc. Essentiel : fond jaune, texte noir. Tags : fond gris clair, texte gris foncé, préfixé « # ».

Toast / notifications En bas à droite, auto-dismiss après 3-5 secondes. Vert pour succès, rouge pour erreur.

3 états obligatoires pour toute vue de données

Chargement : squelette animé (placeholder rectangles gris pulsant). Pas de spinner.

Vide : icône grande + texte court centré (« Aucune transmission »)

Erreur : icône alerte + message + bouton « Réessayer »

Chaque zone qui charge des données depuis la base DOIT implémenter ces 3 états.

Confirmation de suppression Jamais de confirm() natif du navigateur. Toujours une modale dédiée avec titre, message explicatif, bouton « Annuler » + bouton coloré selon la gravité (orange pour archiver, rouge pour supprimer).

Sécurité d'affichage

Tout contenu texte riche (HTML de l'éditeur) doit être sanitisé avant affichage (équivalent DOMPurify)

Tout texte provenant de la base injecté dans le DOM doit être échappé (protection XSS)

Les URL d'images stockées doivent être des signed URLs avec expiration (15 minutes)

6. RÈGLES MÉTIER

Règle Valeur Titre min 3 caractères Titre max 100 caractères Contenu min 10 caractères (texte brut, hors HTML) Images max par transmission 3 Taille max par image 5 Mo Types d'images acceptés image/* (JPEG, PNG, WebP, GIF) Tags max par transmission 5 Types de tags libre, fonction, anatomie, intervention, matériel, personne, marque Types de transmission libre (défaut), essentiel Statuts ouvert, archivé, supprimé Soft delete Le statut « supprimé » masque la transmission. Seul un admin peut supprimer définitivement Export CSV Ne contient PAS le contenu texte (RGPD) Signed URLs images Expiration 15 minutes (900 secondes) Limite affichage liste 100 transmissions (pagination ou infinite scroll pour la suite)

7. ENTITÉS DE DONNÉES (description fonctionnelle)

Lovable crée le modèle qu'il juge optimal. Ce qui suit décrit les entités métier, pas les tables.

Transmission

L'objet central. Possède un titre, un contenu riche (HTML), un type, un statut, un flag prioritaire, un auteur, une catégorie, une date de création, une date de dernière modification. Peut avoir des images et des tags.

Catégorie

Un référentiel de classement. Chaque catégorie a un libellé et une couleur. Une transmission a exactement une catégorie. Les catégories sont partagées entre modules (le glossaire, le thesaurus auront aussi des catégories). Prévoir un mécanisme de scope (ex : « type de contenu ») pour distinguer les catégories transmissions des catégories glossaire.

Tag

Un mot-clé attaché à une transmission. Un tag a un libellé d'affichage, un libellé normalisé (minuscule, sans accent), et un type parmi 7 valeurs. Les tags sont partagés entre modules. Le lien tag ↔ transmission est N:N. Prévoir un mécanisme polymorphe (ex : table de liaison avec « content_type » + « content_id ») pour réutiliser les tags dans les modules suivants.

Image

Une image attachée à une transmission. Stockée dans un bucket Supabase Storage. Chaque image a un chemin de stockage et une position (1, 2 ou 3). Les images sont aussi partagées entre modules (un terme de glossaire pourra avoir des images). Prévoir le même mécanisme polymorphe (content_type + content_id).

Profil utilisateur

Créé automatiquement à la première connexion Google. Contient : nom, prénom, initiales (calculées), fonction (optionnelle), photo (URL Google), email. Le profil est la même entité pour tous les modules. Le statut d'approbation (en attente, approuvé, refusé, désactivé) est stocké sur le profil.

Type de contenu

Un référentiel technique qui identifie chaque module (« transmissions », « glossaire », « thesaurus »…). Utilisé pour le polymorphisme des catégories, tags et images.

8. SEED DATA (données initiales)

Catégories Transmissions

Libellé Couleur (hex) Organisation #6366f1 Matériel #f59e0b Patient #ef4444 Équipe #10b981 Formation #8b5cf6 Divers #6b7280

Types de tags

libre · fonction · anatomie · intervention · matériel · personne · marque

Compte admin initial

Le premier compte qui se connecte via Google est automatiquement admin (seed). Les suivants sont « en attente ».

9. LIVRABLES ATTENDUS

App React fonctionnelle déployée sur Lovable avec Google Auth

Schéma Supabase créé par Lovable (DDL auto-généré)

RLS policies sur chaque table, respectant les 4 niveaux d'accès

Bucket Storage configuré pour les images

API REST automatiquement disponible via Supabase PostgREST

Page d'attente pour les comptes non approuvés

Écran admin avec gestion des comptes + modération + stats + export

Responsive mobile-first — l'usage principal sera sur téléphone en salle de bloc

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://pcl87-trans.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/0a0a4bdc-a165-4c20-b486-5a8956d40d0f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
