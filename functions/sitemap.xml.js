import { absoluteUrl, escapeHtml } from './_lib/seo.js'

// Static entries carry hand-set priorities; dated entries take lastmod from the
// row so crawlers can tell what actually changed.
const STATIC_ENTRIES = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/oeuvres', priority: '0.9', changefreq: 'monthly' },
  { path: '/blog', priority: '0.8', changefreq: 'weekly' },
  { path: '/livre-d-or', priority: '0.4', changefreq: 'monthly' },
  { path: '/mentions-legales', priority: '0.2', changefreq: 'yearly' },
  { path: '/confidentialite', priority: '0.2', changefreq: 'yearly' },
]

function isoDate(seconds) {
  if (!seconds) return null
  return new Date(seconds * 1000).toISOString().slice(0, 10)
}

function urlEntry({ loc, lastmod, changefreq, priority }) {
  return (
    '<url>' +
    `<loc>${escapeHtml(loc)}</loc>` +
    (lastmod ? `<lastmod>${lastmod}</lastmod>` : '') +
    (changefreq ? `<changefreq>${changefreq}</changefreq>` : '') +
    (priority ? `<priority>${priority}</priority>` : '') +
    '</url>'
  )
}

export async function onRequestGet({ env }) {
  const entries = STATIC_ENTRIES.map((e) =>
    urlEntry({ loc: absoluteUrl(e.path), changefreq: e.changefreq, priority: e.priority })
  )

  try {
    // Paginated blog pages need to be crawlable too, otherwise posts past the
    // first page are only reachable from the sitemap itself.
    const totalRow = await env.DB.prepare(
      `SELECT COUNT(*) AS n FROM posts p JOIN users u ON u.id = p.author_id
       WHERE p.status = 'published' AND u.status = 'active'`
    ).first()
    const totalPages = Math.ceil((totalRow?.n ?? 0) / 20)
    for (let page = 2; page <= totalPages; page++) {
      entries.push(
        urlEntry({
          loc: absoluteUrl(`/blog/page/${page}`),
          changefreq: 'weekly',
          priority: '0.5',
        })
      )
    }

    const posts = await env.DB.prepare(
      `SELECT p.slug, p.updated_at, p.published_at
       FROM posts p JOIN users u ON u.id = p.author_id
       WHERE p.status = 'published' AND u.status = 'active'
       ORDER BY p.published_at DESC`
    ).all()

    for (const p of posts.results || []) {
      entries.push(
        urlEntry({
          loc: absoluteUrl(`/blog/${p.slug}`),
          lastmod: isoDate(p.updated_at || p.published_at),
          changefreq: 'monthly',
          priority: '0.7',
        })
      )
    }
  } catch (e) {
    // A partial sitemap beats a 500: search engines keep the previous version
    // when a fetch fails, but an empty response can flush known URLs.
    console.error('[sitemap] posts query failed', e)
  }

  try {
    const oeuvres = await env.DB.prepare(
      `SELECT slug, updated_at FROM oeuvres
       WHERE status = 'visible' ORDER BY position ASC, id ASC`
    ).all()

    for (const o of oeuvres.results || []) {
      entries.push(
        urlEntry({
          loc: absoluteUrl(`/oeuvres/${o.slug}`),
          lastmod: isoDate(o.updated_at),
          changefreq: 'monthly',
          priority: '0.8',
        })
      )
    }
  } catch (e) {
    console.error('[sitemap] oeuvres query failed', e)
  }

  const body =
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
    entries.join('') +
    '</urlset>'

  return new Response(body, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  })
}
