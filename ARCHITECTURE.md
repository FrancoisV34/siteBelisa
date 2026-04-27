# Architecture

Document technique de référence pour comprendre comment siteBelisa est construit. Cible : développeur qui reprend le projet, ou audit externe.

## 1. Vue d'ensemble

```
┌─────────────────────┐
│   Navigateur user   │
│   (React SPA)       │
└──────────┬──────────┘
           │ HTTPS
           │
┌──────────▼──────────────────────────────────────┐
│           Cloudflare Pages (edge)               │
│                                                 │
│  ┌──────────────┐    ┌─────────────────────┐    │
│  │  Static dist │    │  Pages Functions    │    │
│  │  (React SPA) │    │  /api/*  /r2/*      │    │
│  └──────────────┘    └─────────┬───────────┘    │
└─────────────────────────────────┼───────────────┘
                                  │ bindings
                  ┌───────────────┴────────┐
                  │                        │
            ┌─────▼─────┐           ┌──────▼──────┐
            │   D1      │           │   R2        │
            │ (SQLite)  │           │ (object     │
            │ binding   │           │  storage)   │
            │ DB        │           │ binding     │
            │           │           │ MEDIA       │
            └───────────┘           └─────────────┘
```

- Le navigateur charge la SPA depuis `dist/` (HTML + JS bundle).
- Le routing client (React Router 7) gère toutes les pages publiques et `/admin/*`.
- Pour toute donnée, le client appelle des endpoints `/api/*` servis par les Functions.
- Les Functions accèdent à D1 (DB) via le binding `DB` et à R2 (médias) via `MEDIA`.
- Les images uploadées par l'admin sont stockées dans R2 et servies via `/r2/images/<uuid>.<ext>`.

## 2. Stack

| Couche | Technologie |
|---|---|
| Frontend framework | React 19 |
| Frontend build | Vite 6 |
| Routing client | React Router 7 |
| Editeur riche | TipTap 3 (Prosemirror) |
| Animations | framer-motion |
| Icônes | lucide-react |
| Backend runtime | Cloudflare Workers (Pages Functions) |
| Base de données | Cloudflare D1 (SQLite) |
| Stockage médias | Cloudflare R2 |
| Hash mots de passe | bcryptjs (cost 10) |
| Hosting | Cloudflare Pages |
| Outil de build / deploy | wrangler 4 |

Pas de TypeScript, pas d'ORM, pas de framework backend, pas de Node serveur.

## 3. Structure des dossiers

Voir `README.md` §Structure du projet. Points clefs :

- `src/` — code React (frontend)
- `functions/` — code serveur (Pages Functions)
- `functions/_lib/` — utilitaires partagés (auth, r2, slug, json, admin-gate)
- `migrations/` — migrations SQL D1, numérotées et immuables
- `wrangler.toml` — config Cloudflare (D1 binding `DB`, R2 binding `MEDIA`)

## 4. Modèle de données

### Tables (migrations 0001 + 0002)

| Table | Rôle | Colonnes principales |
|---|---|---|
| `users` | Comptes utilisateurs | `id`, `email` (unique), `password_hash` (bcrypt), `display_name`, `role` (`user`/`admin`), `status` (`active`/`banned`), `created_at` |
| `sessions` | Sessions actives | `token` (PK, 32 bytes hex), `user_id`, `expires_at`, `created_at` |
| `posts` | Articles de blog | `id`, `author_id`, `slug` (unique), `title`, `content_html`, `excerpt`, `cover_image`, `status` (`draft`/`pending`/`published`), `published_at`, `created_at`, `updated_at` |
| `comments` | Commentaires posts | `id`, `post_id` (FK CASCADE), `user_id`, `content`, `status` (`visible`/`hidden`), `created_at` |
| `likes` | J'aime | PK composite (`user_id`, `post_id`), `created_at` |
| `guestbook` | Livre d'or | `id`, `user_id`, `message`, `status`, `created_at` |
| `site_settings` | Paramètres clé/valeur | `key` (PK), `value`, `updated_at` — utilisé pour `home.hero_title`, `home.hero_subtitle` |
| `home_sections` | Sections page d'accueil | `id`, `title`, `body_html`, `image_url`, `position`, `status`, timestamps |
| `home_stats` | Statistiques page d'accueil | `id`, `number`, `label`, `position`, timestamps |
| `oeuvres` | Galerie d'œuvres | `id`, `title`, `year`, `technique`, `dimensions`, `description`, `image_url`, `book_url`, `ebook_url`, `position`, `status`, timestamps |

### Index

- `idx_posts_published` sur `posts(status, published_at DESC)`
- `idx_comments_post` sur `comments(post_id, created_at)`
- `idx_sessions_user` sur `sessions(user_id)`
- `idx_home_sections_position`, `idx_home_stats_position`, `idx_oeuvres_position`

### Conventions

- Tous les timestamps sont des `INTEGER` en secondes Unix (UTC).
- Pas de `updated_at` automatique : les updates écrivent explicitement la valeur.
- Soft-delete via `status = 'hidden'` / `'draft'` — pas de hard-delete sauf sur user et sessions.

## 4.bis Flow de modération des articles

Tout article transite par la même table `posts`. Le statut détermine la visibilité :

```
[Utilisateur connecté]                          [Admin]
  POST /api/posts/submit
       │  status='pending'
       ▼
  ┌─ posts (status='pending') ─┐
  │ visible : auteur seul       │ ───── PATCH /api/admin/posts/:id
  │ + admin via /admin/         │       { status: 'published' }
  └─────────────────────────────┘                │
       │                                          ▼
       │   PATCH /api/posts/mine/:id     ┌─ posts (status='published') ─┐
       │   (édit while pending)          │ visible publiquement (/blog)  │
       │                                 └────────────────────────────────┘
       │   DELETE /api/posts/mine/:id            ▲
       │   (withdraw while pending)              │ DELETE /api/admin/posts/:id
       ▼                                         │ (refus admin = suppression)
  [proposition retirée]                          │
                                          [proposition refusée]
```

Pas de table dédiée, pas de migration de données : la "validation" admin = simple `UPDATE status` sur la même ligne.

## 5. Authentification & autorisation

### Mécanisme

- **Sessions cookie**, pas de JWT.
- À la connexion, le serveur génère un token aléatoire de 32 bytes (`crypto.getRandomValues` → hex), stocke `(token, user_id, expires_at)` dans `sessions`, et pose un cookie `sb_session` (`HttpOnly; Secure; SameSite=Lax; Max-Age=30 jours`).
- À chaque requête, `getCurrentUser(request, env)` :
  1. Lit le cookie `sb_session`
  2. Joint `sessions` ↔ `users` filtré par `expires_at > now()`
  3. Retourne `null` si user `banned`

### Helpers (`functions/_lib/auth.js`)

| Helper | Usage |
|---|---|
| `getCurrentUser(req, env)` | Lit la session, retourne `null` si absent/expiré/banni |
| `requireUser(req, env)` | Renvoie `{ user }` ou `{ error: Response 401 }` |
| `requireRole(user, ...roles)` | Vrai si `user.role` est dans les rôles permis |
| `createSession(env, userId)` | Crée une ligne sessions, retourne `{ token, maxAge }` |
| `deleteSession(env, token)` | Logout simple |
| `deleteSessionsForUser(env, userId)` | Logout global (changement mot de passe, ban) |

### Helper admin (`functions/_lib/admin-gate.js`)

```js
const auth = await adminOnly(request, env)
if (auth.error) return auth.error
// auth.user est un admin authentifié
```

### Côté client

- `src/contexts/AuthContext.jsx` — état global (`user`, `login`, `register`, `logout`, `refresh`)
- `src/components/RequireAuth.jsx` — wrapper redirigeant vers `/login` si non connecté
- `src/components/RequireRole.jsx` — wrapper exigeant un rôle, affiche "Accès refusé" sinon

## 6. Endpoints API

### Publics (lecture seule, sans auth)

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/site/home` | Hero + sections + stats page d'accueil |
| GET | `/api/site/oeuvres` | Liste des œuvres visibles |
| GET | `/api/posts` | Liste paginée des articles publiés (`?limit=20&offset=0`) |
| GET | `/api/posts/[slug]` | Article complet + commentaires |
| GET | `/api/posts/[id]/comments` | Commentaires d'un post |
| GET | `/api/guestbook` | Livre d'or |
| GET | `/r2/[[path]]` | Servir un média R2 (cache long) |

### Authentifiés (utilisateur connecté)

| Méthode | Route | Description |
|---|---|---|
| POST | `/api/auth/login` | Email + password → cookie session |
| POST | `/api/auth/register` | Création compte |
| POST | `/api/auth/logout` | Détruit la session |
| GET | `/api/auth/me` | Retourne l'utilisateur courant |
| PATCH | `/api/auth/me` | Modifie display_name, password |
| POST | `/api/posts/[id]/like` | Toggle like |
| POST | `/api/posts/[id]/comments` | Poster un commentaire |
| POST | `/api/guestbook` | Signer le livre d'or |
| POST | `/api/posts/submit` | Proposer un article (status `pending`, max 5 en attente) |
| GET | `/api/posts/mine` | Liste de mes propositions (tous statuts) |
| GET | `/api/posts/mine/[id]` | Détail d'une proposition (ownership requise) |
| PATCH | `/api/posts/mine/[id]` | Édition d'une proposition (uniquement si `pending`) |
| DELETE | `/api/posts/mine/[id]` | Retrait d'une proposition (uniquement si `pending`) |
| POST | `/api/upload` | Upload image R2 (5 Mo max, jpg/png/webp/gif) |

### Admin (rôle `admin` requis — protégés par `adminOnly()`)

Préfixe `/api/admin/`. Tous protégés par `adminOnly()` qui combine `requireUser` + `requireRole('admin')`.

| Méthode | Route | Description |
|---|---|---|
| GET POST | `/api/admin/posts?status=...` | Liste (filtrable: draft/pending/published) / créer post |
| PATCH DELETE | `/api/admin/posts/[id]` | Modifier / supprimer post |
| GET POST | `/api/admin/oeuvres` | Liste / créer œuvre |
| PATCH DELETE | `/api/admin/oeuvres/[id]` | Modifier / supprimer œuvre |
| POST | `/api/admin/oeuvres/reorder` | Réordonner |
| GET PATCH | `/api/admin/home/hero` | Lire / modifier hero (titre + sous-titre) |
| GET POST | `/api/admin/home/sections` | Liste / créer section |
| PATCH DELETE | `/api/admin/home/sections/[id]` | Modifier / supprimer section |
| POST | `/api/admin/home/sections/reorder` | Réordonner |
| GET POST | `/api/admin/home/stats` | Liste / créer stat |
| PATCH DELETE | `/api/admin/home/stats/[id]` | Modifier / supprimer stat |
| POST | `/api/admin/home/stats/reorder` | Réordonner |
| GET | `/api/admin/users` | Liste tous les users |
| PATCH DELETE | `/api/admin/users/[id]` | Modifier rôle/statut, supprimer |
| GET PATCH DELETE | `/api/admin/comments` (et `[id]`) | Modération |
| GET PATCH DELETE | `/api/admin/guestbook` (et `[id]`) | Modération livre d'or |

## 7. Stockage médias (R2)

- **Bucket** : `belisa-assets` (binding `MEDIA`)
- **Validation** (`functions/_lib/r2.js`) :
  - Types autorisés : `image/jpeg`, `image/png`, `image/webp`, `image/gif`
  - Taille max : **5 Mo**
- **Clés** : `images/<uuid v4>.<ext>` — UUID généré par `crypto.randomUUID()`
- **Lecture** : `functions/r2/[[path]].js` sert le contenu avec `Cache-Control: public, max-age=31536000, immutable`
- **URL publique** : `/r2/images/<uuid>.<ext>` (relative au domaine du site)

## 8. Pages frontend

| Route | Composant | Auth |
|---|---|---|
| `/` | `Home` | public |
| `/oeuvres` | `Oeuvres` | public |
| `/blog` | `Blog` | public |
| `/blog/:slug` | `Post` | public (commenter/liker = auth) |
| `/livre-d-or` | `Guestbook` | public (signer = auth) |
| `/login` | `Login` | public |
| `/register` | `Register` | public |
| `/profil` | `Profile` | auth |
| `/admin` | layout admin (lazy) | rôle `admin` |
| `/admin/posts` | `PostsList` + `PostEditor` | rôle `admin` |
| `/admin/oeuvres` | `OeuvresList` + `OeuvreEditor` | rôle `admin` |
| `/admin/home` | `HomeEditor` + `HomeSectionEditor` | rôle `admin` |
| `/admin/users` | `Users` | rôle `admin` |
| `/admin/moderation` | `Moderation` | rôle `admin` |
| `*` | `NotFound` | public |

## 9. Déploiement

Voir `DEPLOY.md` pour le setup initial. Résumé :

- Cloudflare Pages connecté au repo GitHub, branche `main`
- Build : `npm run build`, output `dist/`
- Bindings configurés dans le dashboard pour Production **et** Preview : `DB` → `site-belisa`, `MEDIA` → `belisa-assets`
- `npx wrangler d1 migrations apply site-belisa --remote` pour appliquer les migrations
- Chaque `git push origin main` redeploie automatiquement

## 10. Sécurité — état actuel

État courant (avant chantier sécu — voir plan d'audit) :

- ✅ Sessions cookie `HttpOnly; Secure; SameSite=Lax`
- ✅ Tokens session générés via `crypto.getRandomValues` (32 bytes)
- ✅ Mots de passe bcrypt cost 10
- ✅ Toutes les requêtes D1 passent par `.bind()` (pas d'injection SQL)
- ✅ Validation upload (taille + MIME)
- ✅ Endpoints admin protégés par `adminOnly()`
- ⚠️ **HTML utilisateur (TipTap) rendu via `dangerouslySetInnerHTML` sans sanitization serveur** — risque XSS stocké, à corriger
- ⚠️ Pas de headers CSP / HSTS / X-Frame-Options
- ⚠️ Pas de rate limiting sur login/register/upload
- ⚠️ Pas de flow reset password
- ⚠️ Pas de mentions légales / politique de confidentialité (LCEN/RGPD)

Voir le plan d'audit (`/Users/fv/.claude/plans/`) pour la roadmap de durcissement.

## 11. Tests

État courant : **aucun test, aucune CI**. Stack ciblée pour le chantier tests :

- **Vitest** (unitaire + intégration) — natif Vite
- **Playwright** (E2E)
- **miniflare** pour simuler D1/R2 en intégration

## 12. Références rapides — fichiers critiques

| Sujet | Fichier |
|---|---|
| Auth serveur | `functions/_lib/auth.js`, `functions/_lib/admin-gate.js` |
| Validation upload | `functions/_lib/r2.js` |
| Slug | `functions/_lib/slug.js` |
| Réponses JSON | `functions/_lib/json.js` |
| Auth client | `src/contexts/AuthContext.jsx` |
| Guards client | `src/components/RequireAuth.jsx`, `src/components/RequireRole.jsx` |
| Routing | `src/App.jsx` |
| Schema DB | `migrations/0001_init.sql`, `migrations/0002_content.sql`, `migrations/0003_login_lockout.sql` |
| Soumission user | `functions/api/posts/submit.js`, `functions/api/posts/mine/*.js`, `src/components/SubmitArticleModal.jsx` |
| Modération admin | `src/pages/admin/Moderation.jsx` (section pending), filtre `?status=pending` dans `functions/api/admin/posts/index.js` |
| Upload R2 | `functions/api/upload.js` (anciennement `admin/upload.js`) |
| Config CF | `wrangler.toml` |
| Build | `vite.config.js`, `package.json` |
