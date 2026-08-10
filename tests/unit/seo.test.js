import { describe, it, expect } from 'vitest'
import {
  SITE_URL,
  absoluteUrl,
  escapeHtml,
  htmlToText,
  truncate,
  pageTitle,
  isNoIndex,
  personSchema,
  breadcrumbSchema,
} from '../../functions/_lib/seo.js'

describe('absoluteUrl', () => {
  it('prefixes site-relative paths', () => {
    expect(absoluteUrl('/blog')).toBe(`${SITE_URL}/blog`)
  })

  it('adds the missing leading slash', () => {
    expect(absoluteUrl('blog')).toBe(`${SITE_URL}/blog`)
  })

  it('leaves absolute URLs alone', () => {
    const external = 'https://www.amazon.fr/stores/author/B079K1VS64'
    expect(absoluteUrl(external)).toBe(external)
  })

  it('falls back to the site root when given nothing', () => {
    expect(absoluteUrl('')).toBe(SITE_URL)
    expect(absoluteUrl(null)).toBe(SITE_URL)
  })
})

describe('escapeHtml', () => {
  it('escapes every character that could break out of an attribute', () => {
    expect(escapeHtml(`<a href="x" title='y'>&</a>`)).toBe(
      '&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;'
    )
  })

  it('renders null and undefined as an empty string, not "null"', () => {
    expect(escapeHtml(null)).toBe('')
    expect(escapeHtml(undefined)).toBe('')
  })
})

describe('htmlToText', () => {
  it('strips tags and collapses whitespace', () => {
    expect(htmlToText('<p>Bonjour</p>\n<p>  le   monde </p>')).toBe('Bonjour le monde')
  })

  it('decodes the entities TipTap produces', () => {
    expect(htmlToText('<p>Caf&eacute;</p>')).toBe('Caf&eacute;')
    expect(htmlToText('<p>a &amp; b</p>')).toBe('a & b')
    expect(htmlToText('<p>1&nbsp;000</p>')).toBe('1 000')
  })

  it('never leaves an open tag behind', () => {
    expect(htmlToText('<p>a</p><img src="x">b')).not.toContain('<')
  })
})

describe('truncate', () => {
  it('leaves short text untouched and adds no ellipsis', () => {
    expect(truncate('Court', 160)).toBe('Court')
  })

  it('cuts on a word boundary rather than mid-word', () => {
    const source = 'abcdef ghijkl mnopqr stuvwx'
    const out = truncate(source, 20)

    expect(out.endsWith('…')).toBe(true)
    expect(out.length).toBeLessThanOrEqual(20)

    // What matters is that the kept text is a run of whole words from the
    // source — no half-word left dangling before the ellipsis.
    const kept = out.slice(0, -1)
    expect(source.startsWith(kept)).toBe(true)
    expect(source[kept.length]).toBe(' ')
  })

  it('falls back to a hard cut when there is no usable space', () => {
    const out = truncate('a'.repeat(300), 50)
    expect(out.length).toBe(50)
    expect(out.endsWith('…')).toBe(true)
  })

  it('handles empty input', () => {
    expect(truncate('')).toBe('')
    expect(truncate(null)).toBe('')
  })
})

describe('pageTitle', () => {
  it('uses the job title on the home page', () => {
    expect(pageTitle()).toBe('Belisa Wagner — Romancière')
  })

  it('suffixes the site name elsewhere', () => {
    expect(pageTitle('Blog')).toBe('Blog — Belisa Wagner')
  })
})

describe('isNoIndex', () => {
  it('excludes private and transactional routes', () => {
    for (const p of ['/login', '/register', '/profil', '/admin']) {
      expect(isNoIndex(p), p).toBe(true)
    }
  })

  it('excludes everything under /admin', () => {
    expect(isNoIndex('/admin/oeuvres/3')).toBe(true)
  })

  it('does not catch routes that merely start with the same letters', () => {
    expect(isNoIndex('/administration-publique')).toBe(false)
  })

  it('keeps public routes indexable', () => {
    for (const p of ['/', '/blog', '/oeuvres', '/oeuvres/mon-livre', '/livre-d-or']) {
      expect(isNoIndex(p), p).toBe(false)
    }
  })
})

describe('personSchema', () => {
  it('is anchored on a stable @id other entities can reference', () => {
    expect(personSchema()['@id']).toBe(`${SITE_URL}/#person`)
  })

  it('carries the identity signals Google uses to disambiguate the author', () => {
    const person = personSchema()
    expect(person.sameAs).toContain('https://www.amazon.fr/stores/author/B079K1VS64')
    expect(person.homeLocation.address.addressLocality).toBe('Sainte-Maxime')
    expect(person.homeLocation.address.postalCode).toBe('83120')
  })
})

describe('breadcrumbSchema', () => {
  it('numbers positions from 1 and resolves items to absolute URLs', () => {
    const crumbs = breadcrumbSchema([
      { name: 'Accueil', path: '/' },
      { name: 'Les ouvrages', path: '/oeuvres' },
    ])
    expect(crumbs.itemListElement.map((i) => i.position)).toEqual([1, 2])
    expect(crumbs.itemListElement[1].item).toBe(`${SITE_URL}/oeuvres`)
  })
})
