# siteBelisa

Site personnel de l'artiste Belisa Wagner — vitrine + blog + livre d'or, avec un panneau d'administration permettant à Belisa d'éditer le contenu (page d'accueil, galerie d'œuvres, articles) sans toucher au code.

- **Frontend** : React 19 + Vite (SPA, React Router 7)
- **Backend** : Cloudflare Pages Functions (serverless)
- **Base de données** : Cloudflare D1 (SQLite managé)
- **Stockage médias** : Cloudflare R2 (images uploadées par l'admin)
- **Hébergement** : Cloudflare Pages

## Documentation

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — schéma technique, endpoints, modèle de données
- [`DEPLOY.md`](./DEPLOY.md) — déploiement initial sur Cloudflare Pages
- [`CLAUDE.md`](./CLAUDE.md) — conventions et commandes utiles (pour assistants IA et nouveaux contributeurs)

## Prérequis

- Node.js ≥ 20
- npm ≥ 10
- Un compte Cloudflare (gratuit) pour le déploiement
- `npx wrangler login` une fois pour la première utilisation

## Installation

```bash
git clone <repo-url>
cd siteBelisa
npm install
```

## Développement local

Le projet a deux modes de dev complémentaires :

### Mode SPA seul (Vite, le plus rapide)

```bash
npm run dev
```

Sert le frontend sur `http://localhost:5173`. Les routes `/api/*` ne sont pas disponibles dans ce mode — utile uniquement pour itérer sur du pur frontend statique.

### Mode complet (Pages Functions + D1 + R2 locaux)

```bash
npm run build
npx wrangler pages dev dist --d1=DB=site-belisa --r2=MEDIA=belisa-assets
```

Sert le site complet sur `http://localhost:8788` avec une D1 et un R2 simulés en local. C'est le mode à utiliser pour tester auth, admin, upload, etc.

Avant le premier lancement, appliquer les migrations en local :

```bash
npx wrangler d1 migrations apply site-belisa --local
```

### Créer un compte admin local

```bash
bash scripts/local/seed-admin.sh
```

Ce script (gitignored) crée le compte admin de Belisa dans la D1 locale. À adapter pour ton propre dev.

## Scripts npm

| Commande | Description |
|---|---|
| `npm run dev` | Vite dev server (frontend seul, port 5173) |
| `npm run build` | Build production dans `dist/` |
| `npm run preview` | Sert le `dist/` build localement |

## Structure du projet

```
siteBelisa/
├── src/                    # Frontend React
│   ├── pages/              # Pages publiques (Home, Blog, Oeuvres, Login, …)
│   │   └── admin/          # Panneau admin (PostEditor, HomeEditor, …)
│   ├── components/         # Composants réutilisables (Navbar, RequireRole, …)
│   ├── contexts/           # AuthContext (état utilisateur global)
│   ├── App.jsx             # Routing
│   └── main.jsx            # Point d'entrée
├── functions/              # Cloudflare Pages Functions (backend)
│   ├── api/
│   │   ├── auth/           # login / register / logout / me
│   │   ├── posts/          # endpoints publics blog
│   │   ├── admin/          # CRUD admin (posts, oeuvres, home, users, …)
│   │   └── site/           # contenu public (home, oeuvres)
│   ├── r2/                 # Service des médias R2
│   └── _lib/               # Utilitaires partagés (auth, r2, slug, …)
├── migrations/             # Migrations SQL D1 (numérotées)
├── public/                 # Assets statiques
├── scripts/local/          # Scripts dev locaux (gitignored)
├── wrangler.toml           # Config Cloudflare (D1, R2, build)
└── vite.config.js          # Config Vite
```

## Déploiement

Voir [`DEPLOY.md`](./DEPLOY.md) pour le setup initial Cloudflare Pages.

Une fois configuré, **chaque `git push origin main` déclenche un déploiement automatique**.

Pour appliquer une nouvelle migration en prod :

```bash
npx wrangler d1 migrations apply site-belisa --remote
```

## Variables d'environnement / bindings

Aucun fichier `.env` n'est utilisé. Toute la configuration passe par les **bindings Cloudflare** déclarés dans `wrangler.toml` :

- `DB` → D1 database `site-belisa`
- `MEDIA` → R2 bucket `belisa-assets`

En local, wrangler simule ces bindings automatiquement via les flags `--d1` et `--r2`.

## Licence

Privé — tous droits réservés.
