// Resolves a public route to the metadata and pre-rendered body the middleware
// injects. Returns `null` for paths the SPA does not serve, which the caller
// turns into a real 404.

import {
  SITE_NAME,
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  STATIC_ROUTES,
  absoluteUrl,
  escapeHtml,
  htmlToText,
  truncate,
  pageTitle,
  isNoIndex,
  personSchema,
  webSiteSchema,
  breadcrumbSchema,
  authorRef,
  formatIsoDate,
} from './seo.js'

// Injected alongside the main content so crawlers have real links to follow
// from every page, not just whatever the sitemap lists.
const CRAWL_NAV = `<nav aria-label="Navigation principale"><ul>` +
  [
    ['/', 'Accueil'],
    ['/oeuvres', 'Les ouvrages'],
    ['/blog', 'Blog'],
    ['/livre-d-or', "Livre d'or"],
  ]
    .map(([href, label]) => `<li><a href="${href}">${label}</a></li>`)
    .join('') +
  `</ul></nav>`

function wrap(main) {
  return `<div data-seo-prerender="1">${main}${CRAWL_NAV}</div>`
}

function formatDateFr(seconds) {
  if (!seconds) return ''
  return new Date(seconds * 1000).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

async function resolveHome(env) {
  const settings = await env.DB.prepare(
    `SELECT key, value FROM site_settings WHERE key IN ('home.hero_title', 'home.hero_subtitle')`
  ).all()
  const map = Object.fromEntries((settings.results || []).map((r) => [r.key, r.value]))

  const sections = await env.DB.prepare(
    `SELECT title, body_html, image_url FROM home_sections
     WHERE status = 'visible' ORDER BY position ASC, id ASC`
  ).all()

  const heroTitle = map['home.hero_title'] || SITE_NAME
  const heroSubtitle = map['home.hero_subtitle'] || ''
  const rows = sections.results || []

  const description = truncate(
    heroSubtitle || htmlToText(rows[0]?.body_html) || DEFAULT_DESCRIPTION
  )

  const main =
    `<h1>${escapeHtml(heroTitle)}</h1>` +
    (heroSubtitle ? `<p>${escapeHtml(heroSubtitle)}</p>` : '') +
    rows
      .map(
        (s) =>
          `<section><h2>${escapeHtml(s.title)}</h2>${s.body_html || ''}</section>`
      )
      .join('')

  return {
    title: pageTitle(),
    description,
    ogImage: DEFAULT_OG_IMAGE,
    ogType: 'website',
    schemas: [personSchema(), webSiteSchema()],
    main: wrap(main),
  }
}

async function resolveBlogIndex(env) {
  const { results } = await env.DB.prepare(
    `SELECT p.slug, p.title, p.excerpt, p.published_at
     FROM posts p JOIN users u ON u.id = p.author_id
     WHERE p.status = 'published' AND u.status = 'active'
     ORDER BY p.published_at DESC LIMIT 50`
  ).all()
  const posts = results || []

  const main =
    `<h1>Blog</h1>` +
    `<ul>` +
    posts
      .map(
        (p) =>
          `<li><a href="/blog/${escapeHtml(p.slug)}"><h2>${escapeHtml(p.title)}</h2></a>` +
          (p.excerpt ? `<p>${escapeHtml(p.excerpt)}</p>` : '') +
          `</li>`
      )
      .join('') +
    `</ul>`

  return {
    title: pageTitle('Blog'),
    description: truncate(
      `Les articles et actualités de ${SITE_NAME}, romancière. ${posts.length} article${posts.length > 1 ? 's' : ''} à lire.`
    ),
    ogImage: DEFAULT_OG_IMAGE,
    ogType: 'website',
    schemas: [
      personSchema(),
      webSiteSchema(),
      breadcrumbSchema([
        { name: 'Accueil', path: '/' },
        { name: 'Blog', path: '/blog' },
      ]),
      {
        '@type': 'ItemList',
        itemListElement: posts.map((p, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: absoluteUrl(`/blog/${p.slug}`),
          name: p.title,
        })),
      },
    ],
    main: wrap(main),
  }
}

async function resolvePost(env, slug) {
  const post = await env.DB.prepare(
    `SELECT p.slug, p.title, p.content_html, p.excerpt, p.cover_image,
            p.published_at, p.updated_at, u.display_name AS author_name
     FROM posts p JOIN users u ON u.id = p.author_id
     WHERE p.slug = ? AND p.status = 'published' AND u.status = 'active'`
  ).bind(slug).first()

  if (!post) return null

  const description = truncate(post.excerpt || htmlToText(post.content_html))
  const image = post.cover_image || DEFAULT_OG_IMAGE
  const published = formatIsoDate(post.published_at)
  const modified = formatIsoDate(post.updated_at) || published

  const main =
    (post.cover_image
      ? `<img src="${escapeHtml(post.cover_image)}" alt="${escapeHtml(post.title)}" />`
      : '') +
    `<article><h1>${escapeHtml(post.title)}</h1>` +
    `<p>Par ${escapeHtml(post.author_name)}` +
    (post.published_at
      ? ` — <time datetime="${published}">${formatDateFr(post.published_at)}</time>`
      : '') +
    `</p>${post.content_html || ''}</article>`

  return {
    title: pageTitle(post.title),
    description,
    ogImage: image,
    ogType: 'article',
    schemas: [
      personSchema(),
      webSiteSchema(),
      breadcrumbSchema([
        { name: 'Accueil', path: '/' },
        { name: 'Blog', path: '/blog' },
        { name: post.title, path: `/blog/${post.slug}` },
      ]),
      {
        '@type': 'Article',
        headline: truncate(post.title, 110),
        description,
        image: absoluteUrl(image),
        author: authorRef(),
        publisher: authorRef(),
        datePublished: published,
        dateModified: modified,
        inLanguage: 'fr-FR',
        mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
      },
    ],
    main: wrap(main),
  }
}

async function resolveOeuvres(env) {
  const { results } = await env.DB.prepare(
    `SELECT title, year, description, image_url FROM oeuvres
     WHERE status = 'visible' ORDER BY position ASC, id ASC`
  ).all()
  const oeuvres = results || []

  const main =
    `<h1>Les ouvrages</h1><ul>` +
    oeuvres
      .map(
        (o) =>
          `<li><h2>${escapeHtml(o.title)}</h2>` +
          (o.year ? `<p>${escapeHtml(o.year)}</p>` : '') +
          (o.description ? `<p>${escapeHtml(o.description)}</p>` : '') +
          `</li>`
      )
      .join('') +
    `</ul>`

  return {
    title: pageTitle('Les ouvrages'),
    description: truncate(
      `Les ${oeuvres.length} ouvrages de ${SITE_NAME} : ` +
        oeuvres.map((o) => o.title).join(', ')
    ),
    ogImage: oeuvres[0]?.image_url || DEFAULT_OG_IMAGE,
    ogType: 'website',
    schemas: [
      personSchema(),
      webSiteSchema(),
      breadcrumbSchema([
        { name: 'Accueil', path: '/' },
        { name: 'Les ouvrages', path: '/oeuvres' },
      ]),
      {
        '@type': 'ItemList',
        itemListElement: oeuvres.map((o, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: o.title,
        })),
      },
    ],
    main: wrap(main),
  }
}

const SIMPLE_PAGES = {
  '/livre-d-or': {
    heading: "Livre d'or",
    description: `Laissez un message à ${SITE_NAME} et lisez ceux des autres lecteurs.`,
  },
  '/mentions-legales': {
    heading: 'Mentions légales',
    description: `Mentions légales du site de ${SITE_NAME} : éditeur, hébergeur, propriété intellectuelle.`,
  },
  '/confidentialite': {
    heading: 'Politique de confidentialité',
    description: `Comment les données personnelles sont collectées et traitées sur le site de ${SITE_NAME}.`,
  },
  '/login': { heading: 'Connexion', description: 'Connectez-vous à votre compte.' },
  '/register': { heading: 'Inscription', description: 'Créez votre compte.' },
  '/profil': { heading: 'Mon profil', description: 'Votre espace personnel.' },
}

function resolveSimple(pathname) {
  const page = SIMPLE_PAGES[pathname]
  if (!page) return null
  return {
    title: pageTitle(page.heading),
    description: truncate(page.description),
    ogImage: DEFAULT_OG_IMAGE,
    ogType: 'website',
    schemas: [
      personSchema(),
      webSiteSchema(),
      breadcrumbSchema([
        { name: 'Accueil', path: '/' },
        { name: page.heading, path: pathname },
      ]),
    ],
    main: wrap(`<h1>${escapeHtml(page.heading)}</h1>`),
  }
}

export async function resolvePage(pathname, env) {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname

  let meta = null

  if (path === '/') meta = await resolveHome(env)
  else if (path === '/blog') meta = await resolveBlogIndex(env)
  else if (path === '/oeuvres') meta = await resolveOeuvres(env)
  else if (path.startsWith('/blog/')) {
    const slug = decodeURIComponent(path.slice('/blog/'.length))
    if (slug && !slug.includes('/')) meta = await resolvePost(env, slug)
  } else if (STATIC_ROUTES.has(path)) meta = resolveSimple(path)

  // Admin routes exist in the SPA but have nothing to index: serve the shell
  // with a noindex directive rather than 404-ing a route the app can render.
  if (!meta && isNoIndex(path)) {
    meta = {
      title: pageTitle('Administration'),
      description: '',
      ogImage: DEFAULT_OG_IMAGE,
      ogType: 'website',
      schemas: [],
      main: '',
    }
  }

  if (!meta) return null

  return {
    ...meta,
    canonical: absoluteUrl(path),
    robots: isNoIndex(path) ? 'noindex, nofollow' : 'index, follow',
  }
}
