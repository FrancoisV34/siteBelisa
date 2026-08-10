# SEO

Comment le référencement fonctionne sur ce site, et ce qu'il faut faire à chaque
déploiement. Voir aussi `ARCHITECTURE.md`, `DEPLOY.md`, `SECURITY.md`.

## Principe

Le site est une SPA React : sans intervention, un crawler reçoit un `index.html`
vide et n'indexe rien. Un middleware Pages Functions
(`functions/_middleware.js`) intercepte donc chaque requête HTML, résout les
métadonnées de la route contre D1, et réécrit le document avec `HTMLRewriter`
avant de le servir.

**Règle non négociable : le même HTML est servi aux robots et aux humains.**
Aucune détection d'user-agent, nulle part. Servir un contenu différent aux
crawlers s'appelle du *dynamic rendering* ; Google le déconseille et, mal fait,
c'est du cloaking. Un test e2e (`tests/e2e/seo.spec.js`) compare le DOM injecté
au DOM rendu par React et échoue en cas de divergence.

Injecter le contenu dans `#root` sert aussi la performance : le navigateur peint
le texte et l'image principale avant l'hydratation, ce qui sort le LCP du chemin
critique JavaScript.

## Fichiers

| Fichier | Rôle |
|---|---|
| `functions/_lib/seo.js` | `SITE_URL`, identité de l'autrice, briques schema.org, helpers |
| `functions/_lib/seo-resolve.js` | Métadonnées + HTML pré-rendu pour chaque route |
| `functions/_middleware.js` | Injection `HTMLRewriter` + en-têtes de sécurité |
| `functions/robots.txt.js` | `robots.txt` généré |
| `functions/sitemap.xml.js` | `sitemap.xml` généré depuis D1 |
| `src/components/SeoFields.jsx` | Bloc « Référencement » des éditeurs admin |
| `src/lib/image.js` | Compression des images à l'upload |

## Changer de domaine

Une seule constante porte l'origine :

```js
// functions/_lib/seo.js
export const SITE_URL = 'https://belisa-wagner.fr'
```

Canonical, Open Graph, JSON-LD, `robots.txt` et `sitemap.xml` en découlent tous.
Après modification : `npm run build`, puis push. Rien d'autre à toucher.

Si le domaine historique `belisawagner.fr` est récupéré (procédure SYRELI en
cours), mettre `SITE_URL` à jour **et** poser une redirection 301 permanente
depuis l'ancien domaine, pour ne pas perdre l'acquis.

## Ajouter une route publique

Une route absente de la table de résolution renvoie un vrai 404 — c'est
volontaire, c'est ce qui a supprimé les soft 404 du fallback SPA. Pour toute
nouvelle page publique :

1. l'ajouter à `STATIC_ROUTES` dans `functions/_lib/seo.js` (ou gérer le préfixe
   dynamique dans `resolvePage`) ;
2. lui donner un titre et une description dans `seo-resolve.js` ;
3. l'ajouter à `STATIC_ENTRIES` dans `functions/sitemap.xml.js` si elle doit être
   indexée ;
4. ajouter la route côté React dans `src/App.jsx`.

Oublier l'étape 1 rend la page inaccessible en 404 — c'est le piège principal.

## Données structurées

Un seul graphe JSON-LD par page, avec `Person` et `WebSite` partout, référencés
par `@id` depuis les autres entités.

| Route | Types |
|---|---|
| `/` | `Person`, `WebSite` |
| `/blog` | + `BreadcrumbList`, `ItemList` |
| `/blog/:slug` | + `BreadcrumbList`, `Article` |
| `/oeuvres` | + `BreadcrumbList`, `ItemList` |
| `/oeuvres/:slug` | + `BreadcrumbList`, `Book`, `BookEdition` |

Le catalogue est exclusivement composé de livres : pas de `VisualArtwork`.
`LocalBusiness` est délibérément absent — Belisa vend via Amazon et n'a pas
d'établissement recevant du public ; le baliser ainsi serait inexact. L'ancrage
géographique passe par `homeLocation` sur le `Person`.

Renseigner l'ISBN d'un ouvrage dans l'admin est ce qui relie la page à l'édition
réelle et débloque les Book Actions de Google.

Validation : coller le JSON-LD dans <https://validator.schema.org/>. Une fois le
domaine en ligne, passer aussi par le Rich Results Test de Google, qui exige une
URL publique.

## Images

Cloudflare Image Resizing est une option payante et le runtime Workers ne sait
pas encoder d'images. L'optimisation a donc lieu dans le navigateur au moment de
l'upload (`src/lib/image.js`) : redimensionnement à 1600px sur le plus grand
côté, ré-encodage en WebP qualité 0.82. Mesuré sur une couverture réelle :
1052 Ko → 112 Ko.

L'original est conservé quand le ré-encodage n'apporte rien, et les GIF passent
sans transformation pour préserver l'animation.

**Les images déjà en base restent lourdes** tant qu'elles ne sont pas
re-téléversées depuis l'admin. Pour repérer les plus grosses :

```bash
npx wrangler r2 object list belisa-assets
```

## Performance

Mesures sur profil bridé (5 Mbps, CPU ÷4), avant et après le chantier :

| Page | LCP | CLS |
|---|---|---|
| `/` | 1428 → 1428 ms | 0,110 → 0,005 |
| `/oeuvres` | 2756 → 1232 ms | 0,063 → 0,006 |
| `/oeuvres/:slug` | 1908 → 568 ms | 0,083 → 0,001 |
| `/blog` | 1924 → 1908 ms | 0,251 → 0,008 |

Deux pièges rencontrés, à ne pas réintroduire :

- **`.main-content` a un `min-height`.** Sans lui, le footer se place en bas du
  viewport pendant le chargement des données puis se fait chasser quand elles
  arrivent — c'était toute la CLS de `/blog`.
- **Le fondu de première apparition (`AnimatePresence`) doit rester.** Il semble
  décoratif, mais il couvre le moment où React remplace le HTML injecté. Le
  supprimer fait passer la CLS de `/oeuvres` de 0,006 à 0,222 pour ~50 ms de LCP
  gagnés.

## À faire après la mise en ligne du domaine

1. **Google Search Console** — <https://search.google.com/search-console>,
   propriété de type *Domaine*, vérification par enregistrement DNS TXT (le DNS
   est chez Cloudflare). Soumettre `https://<domaine>/sitemap.xml`.
2. **Bing Webmaster Tools** — <https://www.bing.com/webmasters>, import possible
   depuis Search Console. Bing alimente aussi les réponses de plusieurs moteurs
   conversationnels.
3. **Vérifier l'indexation** au bout de quelques jours via l'inspection d'URL,
   en contrôlant que le HTML *crawlé* contient bien titre, description et JSON-LD
   sans exécution de JavaScript.
4. **Suivre** : pages indexées, impressions, position moyenne sur « belisa
   wagner » et sur chaque titre d'ouvrage. Points d'étape à 4 puis 12 semaines.

## Mesure d'audience : décision en attente

Aucun outil de mesure n'est installé, **délibérément**. Deux obstacles réels :

- `src/pages/Confidentialite.jsx` affirme que le site « n'utilise aucun service
  d'analyse tiers ». Installer un outil sans réécrire ce passage créerait une
  contradiction entre la politique publiée et la réalité.
- La CSP est verrouillée sur `script-src 'self'` et `connect-src 'self'`
  (`functions/_middleware.js`). Cloudflare Web Analytics charge un script depuis
  `static.cloudflareinsights.com` et émet des beacons : il faudrait ouvrir la CSP
  sur ces deux origines.

Cloudflare Web Analytics reste le meilleur candidat — sans cookie, donc sans
bandeau de consentement, et Cloudflare figure déjà comme sous-traitant dans la
politique. Mais le déployer suppose d'assumer ces deux modifications. C'est une
décision éditoriale et juridique, pas technique.

Search Console, lui, ne pose aucun de ces problèmes : il ne dépose rien chez le
visiteur et se vérifie par DNS.
