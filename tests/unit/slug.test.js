import { describe, it, expect, vi } from 'vitest'
import { slugify, uniqueSlug } from '../../functions/_lib/slug.js'

describe('slugify', () => {
  it('lowercases and replaces spaces with dashes', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('strips diacritics', () => {
    expect(slugify('Été à Paris')).toBe('ete-a-paris')
  })

  it('collapses multiple separators', () => {
    expect(slugify('a   b---c')).toBe('a-b-c')
  })

  it('trims leading/trailing dashes', () => {
    expect(slugify('---abc---')).toBe('abc')
  })

  it('caps length at 80 chars', () => {
    const out = slugify('a'.repeat(200))
    expect(out.length).toBeLessThanOrEqual(80)
  })

  it('falls back to "post" when input has no alphanumerics', () => {
    expect(slugify('???')).toBe('post')
    expect(slugify('')).toBe('post')
  })

  it('coerces non-string inputs', () => {
    expect(slugify(123)).toBe('123')
  })
})

function makeMockEnv(existingSlugs) {
  const seen = new Set(existingSlugs)
  return {
    DB: {
      prepare: (sql) => ({
        bind: (slug, _excludeId) => ({
          first: async () => (seen.has(slug) ? { id: 1 } : null),
        }),
      }),
    },
  }
}

describe('uniqueSlug', () => {
  it('returns base slug when not taken', async () => {
    const env = makeMockEnv([])
    expect(await uniqueSlug(env, 'hello')).toBe('hello')
  })

  it('appends -2, -3 when collisions occur', async () => {
    const env = makeMockEnv(['hello', 'hello-2'])
    expect(await uniqueSlug(env, 'hello')).toBe('hello-3')
  })

  it('uses excludeId branch when provided', async () => {
    const prepareSpy = vi.fn(() => ({
      bind: () => ({ first: async () => null }),
    }))
    const env = { DB: { prepare: prepareSpy } }
    await uniqueSlug(env, 'hello', 42)
    expect(prepareSpy.mock.calls[0][0]).toMatch(/id != \?/)
  })
})
