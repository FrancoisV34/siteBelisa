import { SITE_URL } from './_lib/seo.js'

// Served dynamically so the sitemap URL always follows SITE_URL — a robots.txt
// in public/ would hardcode the origin and silently rot after a domain change.
const BODY = `User-agent: *
Allow: /

Disallow: /admin
Disallow: /api/
Disallow: /login
Disallow: /register
Disallow: /profil

Sitemap: ${SITE_URL}/sitemap.xml
`

export function onRequestGet() {
  return new Response(BODY, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  })
}
