import { test, expect } from '@playwright/test'

// These tests only make sense against the Functions runtime, which is what
// performs the SEO injection. Under the plain Vite dev server there is no
// middleware, so the whole file is skipped.
const FULL_STACK = !!process.env.E2E_BASE_URL

test.describe('SEO injection', () => {
  test.skip(!FULL_STACK, 'requires wrangler pages dev (set E2E_BASE_URL)')

  test('home is fully formed without JavaScript', async ({ request }) => {
    const res = await request.get('/')
    expect(res.status()).toBe(200)
    const html = await res.text()

    expect(html).toContain('<link rel="canonical"')
    expect(html).toMatch(/<meta name="description" content=".+"/)
    expect(html).toContain('property="og:title"')
    expect(html).toContain('property="og:image"')
    expect(html).toContain('name="twitter:card"')
    expect(html).toContain('application/ld+json')
    expect(html).toContain('data-seo-prerender="1"')
    expect(html).toMatch(/<h1>.+<\/h1>/)
  })

  test('JSON-LD is valid and carries Person + WebSite', async ({ request }) => {
    const html = await (await request.get('/')).text()
    const match = html.match(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/
    )
    expect(match).not.toBeNull()

    const data = JSON.parse(match[1])
    expect(data['@context']).toBe('https://schema.org')

    const types = data['@graph'].map((n) => n['@type'])
    expect(types).toContain('Person')
    expect(types).toContain('WebSite')

    const person = data['@graph'].find((n) => n['@type'] === 'Person')
    expect(person.sameAs).toContain('https://www.amazon.fr/stores/author/B079K1VS64')
    expect(person.homeLocation.address.addressLocality).toBe('Sainte-Maxime')
  })

  test('unknown paths return a real 404, not a soft 404', async ({ request }) => {
    for (const path of ['/cette-page-nexiste-pas', '/blog/slug-inexistant']) {
      const res = await request.get(path)
      expect(res.status(), `${path} must 404`).toBe(404)
      expect(await res.text()).toContain('noindex')
    }
  })

  test('private routes are excluded from the index', async ({ request }) => {
    for (const path of ['/login', '/register', '/profil', '/admin']) {
      const html = await (await request.get(path)).text()
      expect(html, `${path} must be noindex`).toContain(
        '<meta name="robots" content="noindex, nofollow">'
      )
    }
  })

  test('robots.txt and sitemap.xml are served and consistent', async ({ request }) => {
    const robots = await request.get('/robots.txt')
    expect(robots.headers()['content-type']).toContain('text/plain')
    const robotsBody = await robots.text()
    expect(robotsBody).toContain('Disallow: /admin')

    const sitemapUrl = robotsBody.match(/Sitemap: (\S+)/)[1]
    const sitemap = await request.get('/sitemap.xml')
    expect(sitemap.headers()['content-type']).toContain('xml')

    const body = await sitemap.text()
    expect(body).toContain('<urlset')
    // The sitemap must advertise the same origin robots.txt points at.
    const origin = new URL(sitemapUrl).origin
    expect(body).toContain(`<loc>${origin}/</loc>`)
  })

  test('each public route gets its own title and canonical', async ({ request }) => {
    const seen = new Map()
    for (const path of ['/', '/blog', '/oeuvres', '/livre-d-or', '/mentions-legales']) {
      const html = await (await request.get(path)).text()
      const title = html.match(/<title>([^<]*)<\/title>/)[1]
      const canonical = html.match(/rel="canonical" href="([^"]*)"/)[1]

      expect(canonical.endsWith(path === '/' ? '/' : path)).toBe(true)
      expect(seen.has(title), `duplicate title "${title}"`).toBe(false)
      seen.set(title, path)
    }
  })

  // The injected markup is a second source of truth alongside the React tree.
  // If the two drift, crawlers and users stop seeing the same page — which is
  // exactly the cloaking failure mode this approach must avoid.
  test('injected content matches what React renders', async ({ page, request }) => {
    const html = await (await request.get('/')).text()
    const injectedH1 = html.match(/<h1>([^<]*)<\/h1>/)[1]

    await page.goto('/')
    await expect(page.locator('h1').first()).toHaveText(injectedH1)
    // React owns the DOM after mount: the prerendered wrapper must be gone.
    await expect(page.locator('[data-seo-prerender]')).toHaveCount(0)
  })

  test('each oeuvre has its own page with Book schema', async ({ request }) => {
    const list = await (await request.get('/oeuvres')).text()
    const first = list.match(/href="(\/oeuvres\/[^"]+)"/)
    test.skip(!first, 'no visible oeuvre in this database')

    const res = await request.get(first[1])
    expect(res.status()).toBe(200)
    const html = await res.text()

    const data = JSON.parse(
      html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]
    )
    const book = data['@graph'].find((n) => n['@type'] === 'Book')
    expect(book).toBeTruthy()
    expect(book.author['@id']).toContain('#person')
    expect(book.url).toContain(first[1])

    const crumbs = data['@graph'].find((n) => n['@type'] === 'BreadcrumbList')
    expect(crumbs.itemListElement).toHaveLength(3)

    // Retail links are commercial; they must not pass authority.
    if (html.includes('book_url') || html.includes('amazon')) {
      expect(html).not.toMatch(/<a[^>]+amazon[^>]+>(?![\s\S]*sponsored)/)
    }
  })

  test('oeuvre pages are listed in the sitemap', async ({ request }) => {
    const list = await (await request.get('/oeuvres')).text()
    const first = list.match(/href="(\/oeuvres\/[^"]+)"/)
    test.skip(!first, 'no visible oeuvre in this database')

    const sitemap = await (await request.get('/sitemap.xml')).text()
    expect(sitemap).toContain(`${first[1]}</loc>`)
  })

  test('article pages carry Article schema with dates', async ({ request }) => {
    const blog = await (await request.get('/blog')).text()
    const firstPost = blog.match(/href="(\/blog\/[^"]+)"/)
    test.skip(!firstPost, 'no published post in this database')

    const html = await (await request.get(firstPost[1])).text()
    const data = JSON.parse(
      html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]
    )
    const article = data['@graph'].find((n) => n['@type'] === 'Article')

    expect(article).toBeTruthy()
    expect(article.datePublished).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(article.author['@id']).toContain('#person')
    expect(html).toContain('property="og:type" content="article"')
  })
})
