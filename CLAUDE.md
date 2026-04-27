# CLAUDE.md

Guide pour assistants IA et nouveaux contributeurs travaillant sur ce repo. Voir aussi `README.md`, `ARCHITECTURE.md`, `DEPLOY.md`.

## Vue d'ensemble en une phrase

SPA React 19 (Vite) servie par Cloudflare Pages, avec un backend en Pages Functions stockant ses données dans D1 (SQLite) et ses médias dans R2 — pas de Node serveur, pas d'ORM, pas de framework backend.

## Conventions code

### Backend (`functions/`)

- **Pas d'ORM** : tout passe par `env.DB.prepare(sql).bind(...).run() / .first() / .all()`. Toujours utiliser `.bind(...)` — jamais d'interpolation de chaîne dans le SQL (risque d'injection).
- **Auth** : chaque endpoint authentifié appelle `requireUser(request, env)` de `functions/_lib/auth.js`. Chaque endpoint admin appelle `adminOnly(request, env)` de `functions/_lib/admin-gate.js`.
- **Réponses JSON** : helper `json()` dans `functions/_lib/json.js`. Toujours `content-type: application/json; charset=utf-8`.
- **Convention de nommage Functions** : routage par fichier façon Pages Functions :
  - `functions/api/posts/[slug].js` → `GET/POST/... /api/posts/:slug`
  - `functions/api/admin/posts/[id].js` → `/api/admin/posts/:id`
  - `[[path]].js` = catch-all (utilisé pour `functions/r2/[[path]].js`)
- **Méthodes HTTP** : exporter `onRequestGet`, `onRequestPost`, `onRequestPatch`, `onRequestDelete` (ou `onRequest` pour multi-méthodes).

### Frontend (`src/`)

- **JS, pas TS** (`.js` / `.jsx`)
- **React 19** + **React Router 7** côté client (SPA)
- **TipTap** pour les éditeurs riches (admin) — produit du HTML stocké brut en DB
- **Tailwind n'est pas utilisé** — CSS classique dans `src/index.css`
- **lucide-react** pour les icônes, **framer-motion** pour les animations
- **Lazy-load les routes admin** (déjà fait dans `App.jsx`) pour ne pas alourdir le bundle public

### Langue

- **UI/textes utilisateur en français** (le site est francophone)
- **Code, commentaires, noms de variables en anglais**
- **Migrations SQL** : commentaires en anglais

## Commandes utiles

| Tâche | Commande |
|---|---|
| Dev frontend seul | `npm run dev` |
| Dev complet (Functions + D1 + R2) | `npm run build && npx wrangler pages dev dist` |
| Appliquer migrations en local | `npx wrangler d1 migrations apply site-belisa --local` |
| Appliquer migrations en prod | `npx wrangler d1 migrations apply site-belisa --remote` |
| Console SQL local | `npx wrangler d1 execute site-belisa --local --command "SELECT * FROM users"` |
| Console SQL prod | `npx wrangler d1 execute site-belisa --remote --command "..."` |
| Lister les fichiers R2 prod | `npx wrangler r2 object list belisa-assets` |
| Build production | `npm run build` |

## Pièges connus

- **`/api/*` retourne 500 en local** : lance via `wrangler pages dev`, pas `vite`. `vite` ne sert pas les Functions.
- **`/api/*` retourne 500 "no such table"** avec `wrangler pages dev` : tu as passé les flags `--d1=DB=...` ou `--r2=MEDIA=...`. Ces flags forcent un *store local séparé* de celui utilisé par `wrangler d1 migrations apply --local`. **Ne les utilise pas** — laisse `wrangler.toml` driver les bindings (`npx wrangler pages dev dist` tout court).
- **`/api/*` retourne 500 en prod après déploiement** : binding D1 ou R2 oublié → voir `DEPLOY.md` §2. Refaire un "Retry deployment" après avoir lié.
- **Login échoue après une nouvelle migration** : la migration n'a pas été appliquée en remote. Lance `npx wrangler d1 migrations apply site-belisa --remote`.
- **Cookie de session perdu en local** : `Secure` est forcé sur le cookie (`functions/_lib/auth.js`) → en local ça marche quand même via `localhost` mais pas via une IP LAN.
- **TipTap stocke du HTML brut** : tout contenu provenant de `posts.content_html`, `home_sections.body_html` est rendu via `dangerouslySetInnerHTML`. **C'est un risque XSS si du HTML non maîtrisé arrive dans la DB.** Aujourd'hui seul l'admin peut écrire ces champs, mais une sanitization serveur est prévue (cf. plan d'audit sécurité).
- **Upload R2** : limité à 5 Mo et aux types `image/jpeg|png|webp|gif` (cf. `functions/_lib/r2.js`). Les fichiers sont servis via `/r2/images/<uuid>.<ext>` avec cache long.
- **`scripts/local/` est gitignored** : ne pas s'attendre à le trouver dans le repo. Contient le seed admin avec credentials.
- **Pas de `.env`** : toute la config passe par `wrangler.toml` (bindings) et le dashboard Cloudflare (secrets).

## Modifier le schéma DB

Toujours créer une nouvelle migration **numérotée et immutable** :

```bash
# Créer migrations/0003_my_change.sql avec des CREATE/ALTER/INSERT
npx wrangler d1 migrations apply site-belisa --local   # tester
npx wrangler d1 migrations apply site-belisa --remote  # prod
```

Ne jamais modifier une migration déjà appliquée — créer une nouvelle migration à la place.

### Ordre de déploiement code ↔ migration

⚠️ **Cloudflare Pages n'applique pas les migrations automatiquement** au déploiement. Si une PR contient à la fois une nouvelle migration **et** du code qui dépend des nouvelles colonnes, il y a une fenêtre où le code en prod plante (colonne inconnue).

Procédure correcte à chaque fois qu'une migration est mergée sur `main` :

```bash
# 1. Push le code → Pages déploie automatiquement (peut planter le temps de l'étape 2)
git push origin main

# 2. IMMÉDIATEMENT après le push, appliquer la migration sur D1 prod
npx wrangler d1 migrations apply site-belisa --remote
```

Pour minimiser la fenêtre d'erreur sur des migrations sensibles (ex. login, paiement), inverser :

```bash
# 1. Appliquer la migration EN PREMIER (la nouvelle colonne existe, code ancien l'ignore)
npx wrangler d1 migrations apply site-belisa --remote

# 2. Puis push le code qui utilise la nouvelle colonne
git push origin main
```

Cette stratégie ne marche que si la migration est **additive** (ALTER TABLE ADD COLUMN avec DEFAULT, CREATE TABLE, CREATE INDEX). Pour des migrations destructrices (DROP COLUMN, RENAME), prévoir une fenêtre de maintenance.

## Sécurité — règles à suivre

- **Toujours `.bind()` les paramètres SQL** — jamais de concaténation
- **Toujours appeler `adminOnly()`** au début des endpoints `/api/admin/*`
- **Ne jamais logger** ni renvoyer les `password_hash` ou `sessions.token`
- **Validation côté serveur** sur tous les inputs (taille, type, format) — jamais faire confiance au client
- **Sanitize le HTML** stocké côté serveur (à implémenter — voir audit sécurité)

## Style des réponses

- **Concis** : ce projet est petit, pas besoin de sur-architecturer
- **Pas de comments inutiles** dans le code (le nom des fonctions/variables doit suffire)
- **FR pour l'UI, EN pour le code**
