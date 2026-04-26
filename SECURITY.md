# Security

Posture de sécurité du projet siteBelisa et procédures opérationnelles.

## 1. Modèle de menaces

Surface d'attaque principale :
- **Site public** (lecture) — risques : DDoS, scraping abusif
- **Inscription/login** — risques : bruteforce, énumération de comptes, abus inscription
- **Commentaires + livre d'or** (utilisateurs auth) — risques : XSS stocké, spam
- **Panel admin** — risques : XSS via TipTap, IDOR, escalade de privilèges
- **Upload R2** — risques : fichiers malveillants, abus d'espace

Profil utilisateur : artiste solo, faible volume, pas de PII sensible (pas de paiement, pas de santé). RGPD niveau "site vitrine" (cf. §6).

## 2. Mesures en place (au niveau code)

### Authentification
- Session **cookie HttpOnly + Secure + SameSite=Lax**, 30 jours, token aléatoire 256 bits (`crypto.getRandomValues`)
- Mots de passe **bcrypt cost 10**
- **Lockout progressif** par compte sur échecs login (`functions/_lib/lockout.js`) :
  - 5 échecs → lock 15 min
  - 6e → 30 min
  - 7e+ → 60 min (cap)
  - Reset sur succès
- Reset password : **non implémenté** (limitation connue — à ajouter si besoin)

### Autorisation
- Endpoints admin protégés par `adminOnly()` (`functions/_lib/admin-gate.js`)
- Frontend : `RequireAuth` et `RequireRole` (defense in depth, pas une sécurité)
- Cascade de checks : session valide → user non banni → rôle attendu

### Injection SQL
- 100% des requêtes D1 utilisent `.bind(...)` (paramétrées)
- Pas d'ORM ni de query builder qui pourrait masquer une concaténation

### XSS
- **Server-side sanitization** via `xss` lib (`functions/_lib/sanitize.js`) sur **tous** les inputs avant insertion DB :
  - `sanitizeRichText()` pour les champs HTML (TipTap : posts, sections home) — allowlist stricte de balises et d'attributs, strip script/style/iframe/event handlers
  - `sanitizePlainText()` pour tous les champs texte (display_name, comments, guestbook, hero, oeuvres, stats) — strip toute balise et son contenu pour script/style
- React échappe par défaut côté client ; `dangerouslySetInnerHTML` est utilisé **uniquement** sur `posts.content_html` et `home_sections.body_html`, qui passent par `sanitizeRichText`
- Liens : `javascript:`, `data:`, `vbscript:`, `file:` rejetés. Attributs `target` strippés (anti window-opener).
- Images : `data:image/...` autorisé, autres data URIs rejetés.

### Headers HTTP
- `functions/_middleware.js` (Functions) + `public/_headers` (assets statiques) :
  - `Content-Security-Policy` strict (`script-src 'self'`, pas d'eval)
  - `Strict-Transport-Security` 2 ans + preload
  - `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy` : camera/micro/géoloc fermés
  - `Cross-Origin-Opener-Policy: same-origin`

### Upload R2
- Validation MIME : `image/jpeg|png|webp|gif` uniquement
- Validation taille : 5 Mo max
- Clés UUID — pas de path traversal ni collision
- Servi en `Cache-Control: public, max-age=31536000, immutable`

### Logging / monitoring
- **À améliorer** : aucun log structuré actuellement sur événements sensibles (login fail, admin action, upload). Cloudflare donne les access logs via dashboard mais sans détails métier.

## 3. Mesures à configurer côté Cloudflare (dashboard)

Le code couvre les attaques applicatives, mais **les attaques au niveau IP/réseau (DDoS, scraping massif, bruteforce distribué) doivent être bloquées au bord** par Cloudflare. Rien dans le code ne peut le faire efficacement à ce niveau.

### 3.1 Rate Limiting Rules (gratuit jusqu'à 10k req/jour)

Dashboard CF → projet `site-belisa` → **Security → WAF → Rate limiting rules**. Créer ces règles :

| Nom | Match | Limite | Action |
|---|---|---|---|
| Login bruteforce | `URI Path eq /api/auth/login` AND `Method eq POST` | 10 req / minute / IP | Block 10 min |
| Register abuse | `URI Path eq /api/auth/register` AND `Method eq POST` | 3 req / heure / IP | Block 1h |
| Comment spam | `URI Path contains /comments` AND `Method eq POST` | 20 req / minute / IP | Block 5 min |
| Guestbook spam | `URI Path eq /api/guestbook` AND `Method eq POST` | 10 req / minute / IP | Block 5 min |
| Upload abuse | `URI Path eq /api/admin/upload` | 60 req / minute / IP | Block 5 min |

Ces règles tournent **en plus** du lockout par compte (qui protège un user spécifique) — elles protègent contre les attaques distribuées et les nouveaux comptes successifs.

### 3.2 Bot Fight Mode

Dashboard CF → **Security → Bots → Bot Fight Mode** : ON (gratuit). Bloque les bots les plus évidents.

### 3.3 Turnstile (optionnel, recommandé)

Si abus persistants sur `/login` ou `/register` malgré §3.1, ajouter Cloudflare Turnstile (CAPTCHA invisible, gratuit) :

1. Dashboard CF → **Turnstile → Add site** → générer une clé site + clé secrète
2. Côté frontend : ajouter le widget sur `Login.jsx` et `Register.jsx`
3. Côté backend : valider le token via `https://challenges.cloudflare.com/turnstile/v0/siteverify`
4. Ajouter la clé secrète comme **secret** dans Pages (`Settings → Variables and Secrets → Production` : `TURNSTILE_SECRET`)

Non implémenté actuellement — le lockout DB + rate limit Cloudflare suffisent au volume actuel.

### 3.4 Dependabot

Activer **Dependabot security updates** sur GitHub (Settings → Code security). Les PRs auto-générées sont à merger après vérification des tests.

## 4. CI / CD security

- `.github/workflows/security.yml` :
  - `npm audit --omit=dev --audit-level=high` à chaque PR + push + lundi 06:00 UTC
  - `gitleaks` scan de tout l'historique git
- `.github/workflows/ci.yml` :
  - tests unitaires + intégration + E2E à chaque PR
  - blocage merge si rouge (à activer dans Settings → Branches)

## 5. Procédure incident / disclosure

### Disclosure responsable

Une vulnérabilité ? Contacter **fra.vittecoq@gmail.com** avec :
- Description du problème
- Étapes pour reproduire
- Impact estimé

Délai de réponse cible : 72h. Pas de bug bounty.

### Procédure interne en cas de compromission suspectée

1. **Couper l'accès** : dans CF dashboard → désactiver le déploiement Pages OU mettre le domaine en "Under Attack Mode" (Security → Settings)
2. **Révoquer toutes les sessions** : `npx wrangler d1 execute site-belisa --remote --command "DELETE FROM sessions"`
3. **Reset password admin** : depuis `scripts/local/seed-admin.sh --remote` (regénère le hash)
4. **Audit logs** : CF Dashboard → Analytics → Logs (filtre sur l'IP suspecte ou l'endpoint `/api/admin/*`)
5. **Restaurer la DB** depuis Time Travel si compromission DB : `npx wrangler d1 time-travel restore site-belisa --bookmark <pre-incident>`
6. **Rotation des secrets** :
   - Sessions : déjà fait via DELETE FROM sessions
   - Cloudflare API token (si CI compromise) : régénérer dans Dashboard, mettre à jour secrets GitHub Actions
7. **Disclosure** : si données utilisateur impactées, communication par email aux comptes concernés (obligation RGPD si fuite de PII)

## 6. RGPD / LCEN — état actuel

À implémenter (non encore fait, cf. plan d'audit) :
- [ ] Page `/mentions-legales` (LCEN obligatoire)
- [ ] Page `/confidentialite` (politique de confidentialité)
- [ ] Endpoint `DELETE /api/auth/me` + bouton "Supprimer mon compte" (anonymise comments/guestbook)
- [ ] Endpoint `GET /api/auth/me/export` (droit d'accès)

Cookies utilisés : uniquement `sb_session` (essentiel — exempt RGPD). Pas de bandeau cookies nécessaire.

## 7. Rotation des secrets

| Secret | Localisation | Rotation |
|---|---|---|
| Cloudflare API token (CI) | GitHub Settings → Secrets | Tous les 6 mois ou si compromis |
| Mot de passe admin | DB users | À la demande (via reseed) |
| Sessions actives | DB sessions | Sur changement password / suspicion |

## 8. Vérifications périodiques (mensuelles)

- [ ] `npm audit --omit=dev` clean (production deps)
- [ ] Score `securityheaders.com` ≥ A
- [ ] Score `mozilla observatory` ≥ B
- [ ] Comptes `users` avec rôle `admin` : limite à ce qui est connu
- [ ] `users` avec `status = 'banned'` purgés > 90j
- [ ] Sessions expirées purgées (à automatiser)
