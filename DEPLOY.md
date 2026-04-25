# Déploiement Cloudflare Pages

Étapes pour mettre le site en production. À faire une seule fois pour le setup initial, puis les déploiements suivants se feront automatiquement à chaque `git push`.

## Prérequis

- Compte Cloudflare (gratuit)
- `npx wrangler login` déjà fait
- Code poussé sur GitHub : `git push origin main`
- D1 déjà créée en local (étapes 3-6 du setup) : la base s'appelle `site-belisa`, l'ID est dans `wrangler.toml`

## 1. Connecter le repo à Cloudflare Pages

Dashboard web Cloudflare → https://dash.cloudflare.com/

1. **Workers & Pages** → **Create** → onglet **Pages** → **Connect to Git**
2. Autoriser GitHub si demandé, choisir le repo `siteBelisa`
3. Configuration du build :
   - **Project name** : `site-belisa` (donnera l'URL `site-belisa.pages.dev`)
   - **Production branch** : `main`
   - **Framework preset** : `None` (ou Vite si proposé)
   - **Build command** : `npm run build`
   - **Build output directory** : `dist`
   - **Root directory** : (vide)
4. **Save and Deploy** — premier build (~1-2 min)

À ce stade le site est déployé mais les routes `/api/*` retourneront 500 parce que la D1 n'est pas encore liée.

## 2. Lier la D1 au projet Pages

Dans le dashboard du projet Pages (toujours dans le navigateur) :

1. **Settings** du projet → **Bindings** (ou **Functions** → **D1 database bindings** selon la version)
2. **Add binding** :
   - Variable name : `DB`
   - D1 database : `site-belisa`
3. **Important** : faire la même chose pour **Production** ET **Preview** (deux entrées séparées)
4. Sauvegarder
5. Aller dans **Deployments** → sur le dernier déploiement, clic sur les `…` → **Retry deployment** (sinon le binding ne prend pas effet sur le déploiement existant)

## 3. Appliquer les migrations en prod

En local :

```bash
npx wrangler d1 migrations apply site-belisa --remote
```

(Le `--remote` cible la D1 hébergée chez Cloudflare, pas la copie locale.)

## 4. Créer le compte admin en prod

```bash
bash scripts/local/seed-admin.sh --remote
```

(Ce script est gitignored, il vit uniquement sur ta machine. Il contient l'email de Belisa et le hash bcrypt de son mot de passe.)

## 5. Vérifier en prod

- Aller sur l'URL `*.pages.dev` que CF affiche dans le dashboard
- `/login` avec les credentials admin → le lien "Admin" doit apparaître
- Créer un article test, vérifier qu'il s'affiche sur `/blog`

## 6. (Optionnel) Domaine custom

Dashboard du projet Pages → **Custom domains** → **Set up a custom domain** → suivre les instructions pour pointer le DNS.

---

## Déploiements suivants

Une fois le setup ci-dessus fait, plus rien à toucher dans le dashboard. Chaque `git push origin main` déclenche automatiquement un build + déploiement.

Pour les changements de schéma DB plus tard :

1. Créer un nouveau fichier `migrations/0003_xxx.sql`
2. `npx wrangler d1 migrations apply site-belisa --local` (pour tester)
3. `npx wrangler d1 migrations apply site-belisa --remote` (pour la prod)
4. Push le code qui utilise les nouvelles colonnes/tables

## Pièges connus

- **Routes `/api/*` qui renvoient 500 en prod** : oubli de lier la D1, ou binding fait sans retrigger le deploy.
- **Login qui échoue avec "Invalid credentials" en prod** : oubli de l'étape 3 (migrations remote) ou de l'étape 4 (seed admin remote).
- **Le `_redirects` génère un warning en local** : ignorer, CF Pages le gère bien en prod.
