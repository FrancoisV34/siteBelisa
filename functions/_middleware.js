// Global middleware: security headers on every response, plus server-side SEO
// injection on HTML documents.
//
// The SEO pass rewrites the static shell produced by Vite so that crawlers and
// users receive the same fully-formed document. There is deliberately no
// user-agent branching: serving different HTML to bots would be dynamic
// rendering, which Google treats as a workaround at best and cloaking at worst.

import { resolvePage } from './_lib/seo-resolve.js'
import { escapeHtml, SITE_NAME, SITE_LOCALE, absoluteUrl } from './_lib/seo.js'

const CSP = [
  "default-src 'self'",
  // 'unsafe-inline' for styles is required by framer-motion / TipTap inline styles.
  // Scripts stay strict (no inline, no eval) — Vite production output is fully bundled.
  // JSON-LD blocks are data, not executable script, so they are unaffected.
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  // R2 media is served from the same origin via /r2/; data: + blob: cover image previews
  // (TipTap editor uses blob URLs while uploading).
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  'upgrade-insecure-requests',
].join('; ')

const SECURITY_HEADERS = {
  'Content-Security-Policy': CSP,
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
}

// Paths owned by other Functions — never treated as SPA documents.
const NON_DOCUMENT_PREFIXES = ['/api/', '/r2/']

function withSecurityHeaders(headers) {
  const out = new Headers(headers)
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
    if (!out.has(k)) out.set(k, v)
  }
  return out
}

function metaTag(attr, name, content) {
  if (!content) return ''
  return `<meta ${attr}="${escapeHtml(name)}" content="${escapeHtml(content)}">`
}

// `</script>` inside a JSON-LD payload would close the block early; escaping the
// opening angle bracket is the standard mitigation.
function jsonLdBlock(schemas) {
  if (!schemas || schemas.length === 0) return ''
  const payload = {
    '@context': 'https://schema.org',
    '@graph': schemas,
  }
  const serialized = JSON.stringify(payload).replace(/</g, '\\u003c')
  return `<script type="application/ld+json">${serialized}</script>`
}

function buildHead(meta) {
  const ogImage = absoluteUrl(meta.ogImage)
  return [
    metaTag('name', 'description', meta.description),
    metaTag('name', 'robots', meta.robots),
    `<link rel="canonical" href="${escapeHtml(meta.canonical)}">`,
    ...(meta.links || []).map(
      (l) => `<link rel="${escapeHtml(l.rel)}" href="${escapeHtml(l.href)}">`
    ),
    metaTag('property', 'og:type', meta.ogType),
    metaTag('property', 'og:title', meta.title),
    metaTag('property', 'og:description', meta.description),
    metaTag('property', 'og:url', meta.canonical),
    metaTag('property', 'og:image', ogImage),
    metaTag('property', 'og:site_name', SITE_NAME),
    metaTag('property', 'og:locale', SITE_LOCALE),
    metaTag('name', 'twitter:card', 'summary_large_image'),
    metaTag('name', 'twitter:title', meta.title),
    metaTag('name', 'twitter:description', meta.description),
    metaTag('name', 'twitter:image', ogImage),
    jsonLdBlock(meta.schemas),
  ].join('')
}

function injectSeo(response, meta) {
  return new HTMLRewriter()
    .on('title', {
      element(el) {
        el.setInnerContent(meta.title)
      },
    })
    .on('head', {
      element(el) {
        el.append(buildHead(meta), { html: true })
      },
    })
    .on('#root', {
      element(el) {
        if (meta.main) el.setInnerContent(meta.main, { html: true })
      },
    })
    .transform(response)
}

export async function onRequest(context) {
  const url = new URL(context.request.url)

  // Serve one URL per page. Without this, /blog and /blog/ both return 200 with
  // identical content; the canonical tag would let Google sort it out, but a
  // redirect is unambiguous and costs no crawl budget.
  if (
    url.pathname.length > 1 &&
    url.pathname.endsWith('/') &&
    !NON_DOCUMENT_PREFIXES.some((p) => url.pathname.startsWith(p))
  ) {
    const target = url.pathname.replace(/\/+$/, '') + url.search
    return new Response(null, {
      status: 301,
      headers: withSecurityHeaders(new Headers({ location: target })),
    })
  }

  // /blog/page/1 is a duplicate of /blog, not a missing page — redirect rather
  // than 404, so a hand-typed or mistakenly linked URL still lands somewhere.
  if (url.pathname === '/blog/page/1') {
    return new Response(null, {
      status: 301,
      headers: withSecurityHeaders(new Headers({ location: '/blog' + url.search })),
    })
  }

  const response = await context.next()

  const isDocument =
    context.request.method === 'GET' &&
    !NON_DOCUMENT_PREFIXES.some((p) => url.pathname.startsWith(p)) &&
    (response.headers.get('content-type') || '').includes('text/html')

  if (!isDocument) {
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: withSecurityHeaders(response.headers),
    })
  }

  let meta = null
  try {
    meta = await resolvePage(url.pathname, context.env)
  } catch (e) {
    // A database hiccup must never take the site down, and must never be
    // mistaken for "this route does not exist" — serve the un-enriched shell
    // untouched rather than a 404 the client would render as a dead page.
    console.error('[seo] resolve failed', url.pathname, e)
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: withSecurityHeaders(response.headers),
    })
  }

  // Unknown path: still serve the shell so the SPA can render its 404 page, but
  // with a real 404 status so search engines stop treating it as a valid page.
  const status = meta ? response.status : 404
  const effective = meta || {
    title: 'Page introuvable — ' + SITE_NAME,
    description: '',
    canonical: absoluteUrl(url.pathname),
    ogImage: null,
    ogType: 'website',
    robots: 'noindex, follow',
    schemas: [],
    main: '',
  }

  const transformed = injectSeo(response, effective)

  return new Response(transformed.body, {
    status,
    statusText: response.statusText,
    headers: withSecurityHeaders(transformed.headers),
  })
}
