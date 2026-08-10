// Server-side SEO metadata resolution.
//
// Every public route resolves to a metadata object here, which the middleware
// injects into the HTML shell before it reaches the client. Crawlers and users
// receive the exact same document — no user-agent sniffing, no dynamic
// rendering. React replaces the injected body on mount.

// Swap this single constant when the final domain is attached to the Pages
// project. Nothing else in the codebase hardcodes the origin.
export const SITE_URL = 'https://belisa-wagner.fr'

export const SITE_NAME = 'Belisa Wagner'
export const SITE_LOCALE = 'fr_FR'

export const AUTHOR = {
  name: 'Belisa Wagner',
  jobTitle: 'Romancière',
  locality: 'Sainte-Maxime',
  postalCode: '83120',
  region: 'Provence-Alpes-Côte d\'Azur',
  country: 'FR',
  sameAs: [
    'https://www.amazon.fr/stores/author/B079K1VS64',
    'https://www.facebook.com/isavitt/',
  ],
}

export const DEFAULT_OG_IMAGE = '/photo-belisa.jpg'
export const DEFAULT_DESCRIPTION =
  'Belisa Wagner, romancière. Découvrez ses ouvrages, son actualité et son blog.'

// Routes rendered by the SPA. Anything outside this list gets a real 404
// instead of the soft 404 the `/* /index.html 200` fallback would produce.
const STATIC_ROUTES = new Set([
  '/',
  '/oeuvres',
  '/blog',
  '/livre-d-or',
  '/login',
  '/register',
  '/profil',
  '/mentions-legales',
  '/confidentialite',
])

// Private or transactional routes: served normally, kept out of the index.
const NOINDEX_ROUTES = new Set(['/login', '/register', '/profil'])

const NOINDEX_PREFIXES = ['/admin']

export function isNoIndex(pathname) {
  if (NOINDEX_ROUTES.has(pathname)) return true
  return NOINDEX_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

export function absoluteUrl(path) {
  if (!path) return SITE_URL
  if (/^https?:\/\//i.test(path)) return path
  return SITE_URL + (path.startsWith('/') ? path : '/' + path)
}

const HTML_ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => HTML_ESCAPES[c])
}

// Rich text is already sanitized on write (see _lib/sanitize.js), so this only
// needs to flatten it into a plain-text summary — not to make it safe.
export function htmlToText(html) {
  return String(html ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#3?9;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

// Meta descriptions are truncated on a word boundary — a description cut
// mid-word reads as broken in the SERP.
export function truncate(text, max = 160) {
  const clean = String(text ?? '').trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd() + '…'
}

export function pageTitle(part) {
  if (!part) return `${SITE_NAME} — ${AUTHOR.jobTitle}`
  return `${part} — ${SITE_NAME}`
}

function formatIsoDate(seconds) {
  if (!seconds) return null
  return new Date(seconds * 1000).toISOString()
}

// --- JSON-LD building blocks -------------------------------------------------

const PERSON_ID = `${SITE_URL}/#person`
const WEBSITE_ID = `${SITE_URL}/#website`

export function personSchema() {
  return {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: AUTHOR.name,
    jobTitle: AUTHOR.jobTitle,
    url: SITE_URL,
    image: absoluteUrl(DEFAULT_OG_IMAGE),
    homeLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: AUTHOR.locality,
        postalCode: AUTHOR.postalCode,
        addressRegion: AUTHOR.region,
        addressCountry: AUTHOR.country,
      },
    },
    sameAs: AUTHOR.sameAs,
  }
}

export function webSiteSchema() {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: 'fr-FR',
    publisher: { '@id': PERSON_ID },
  }
}

export function breadcrumbSchema(trail) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}

export function authorRef() {
  return { '@id': PERSON_ID }
}

export { PERSON_ID, WEBSITE_ID, formatIsoDate, STATIC_ROUTES }
