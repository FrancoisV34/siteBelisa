import { describe, it, expect, vi, beforeEach } from 'vitest'
import { onRequestPatch } from '../../functions/api/admin/posts/[id].js'

// Publishing a post corrupted its excerpt: the field was assigned a boolean
// instead of a string, and D1 serialises a JS boolean as a float, so a TEXT
// column ended up holding the literal "1.0". These tests pin the values that
// actually reach the UPDATE statement.

const EXISTING = {
  id: 7,
  author_id: 1,
  slug: 'mon-article',
  title: 'Mon article',
  content_html: '<p>corps</p>',
  excerpt: 'Extrait rédigé par le membre.',
  cover_image: null,
  meta_description: null,
  og_image: null,
  image_alt: null,
  status: 'pending',
  published_at: null,
}

let bound

function makeEnv() {
  bound = null
  return {
    DB: {
      prepare(sql) {
        const stmt = {
          bind(...args) {
            if (sql.includes('UPDATE posts')) bound = args
            return stmt
          },
          first: async () => (sql.includes('SELECT') ? { ...EXISTING } : null),
          run: async () => ({ meta: { changes: 1 } }),
          all: async () => ({ results: [] }),
        }
        return stmt
      },
    },
  }
}

function makeRequest(payload) {
  return { json: async () => payload }
}

vi.mock('../../functions/_lib/auth.js', () => ({
  requireUser: async () => ({ user: { id: 1, role: 'admin' } }),
  requireRole: () => true,
}))

// Column order in the UPDATE statement.
const COL = { title: 0, slug: 1, content_html: 2, excerpt: 3, cover_image: 4,
  meta_description: 5, og_image: 6, image_alt: 7, status: 8 }

describe('PATCH /api/admin/posts/:id', () => {
  beforeEach(() => { bound = null })

  it('keeps the excerpt a string when publishing with a full payload', async () => {
    const env = makeEnv()
    await onRequestPatch({
      request: makeRequest({
        title: 'Mon article',
        excerpt: 'Extrait rédigé par le membre.',
        content_html: '<p>corps</p>',
        status: 'published',
      }),
      env,
      params: { id: '7' },
    })

    expect(bound).not.toBeNull()
    expect(typeof bound[COL.excerpt]).toBe('string')
    expect(bound[COL.excerpt]).toBe('Extrait rédigé par le membre.')
    expect(bound[COL.status]).toBe('published')
  })

  it('preserves the stored excerpt when the payload only flips the status', async () => {
    const env = makeEnv()
    await onRequestPatch({
      request: makeRequest({ status: 'published' }),
      env,
      params: { id: '7' },
    })

    expect(bound[COL.excerpt]).toBe(EXISTING.excerpt)
    expect(typeof bound[COL.excerpt]).toBe('string')
  })

  it('never binds a boolean to any text column', async () => {
    const env = makeEnv()
    await onRequestPatch({
      request: makeRequest({ status: 'published' }),
      env,
      params: { id: '7' },
    })

    for (const [name, i] of Object.entries(COL)) {
      expect(typeof bound[i], `${name} must not be a boolean`).not.toBe('boolean')
    }
  })

  it('clears the excerpt when it is explicitly emptied', async () => {
    const env = makeEnv()
    await onRequestPatch({
      request: makeRequest({ excerpt: '', status: 'draft' }),
      env,
      params: { id: '7' },
    })

    expect(bound[COL.excerpt]).toBeNull()
  })

  it('does not leak the excerpt into image_alt', async () => {
    const env = makeEnv()
    await onRequestPatch({
      request: makeRequest({ excerpt: 'Un extrait.', status: 'published' }),
      env,
      params: { id: '7' },
    })

    expect(bound[COL.image_alt]).toBeNull()
    expect(bound[COL.image_alt]).not.toBe('Un extrait.')
  })
})
