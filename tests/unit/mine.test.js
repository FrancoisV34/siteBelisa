import { describe, it, expect, beforeEach } from 'vitest'
import {
  onRequestGet as onGetOne,
  onRequestPatch,
  onRequestDelete,
} from '../../functions/api/posts/mine/[id].js'
import { onRequestGet as onListMine } from '../../functions/api/posts/mine/index.js'

function sessionUser({ id = 7, role = 'user' } = {}) {
  return { id, email: 'a@b.c', display_name: 'A', role, status: 'active', token: 't' }
}

function makeEnv({ user = sessionUser(), post = null, ownerId = 7 } = {}) {
  const calls = []
  return {
    DB: {
      prepare: (sql) => ({
        bind: (...args) => {
          calls.push({ sql, args })
          return {
            first: async () => {
              if (sql.includes('FROM sessions s JOIN users u')) return user
              if (sql.includes('FROM posts WHERE id = ?')) {
                if (!post) return null
                return { ...post, author_id: ownerId }
              }
              if (sql.includes('FROM posts WHERE slug')) return null
              return null
            },
            run: async () => ({ success: true, meta: { changes: 1 } }),
            all: async () => ({ results: post ? [post] : [] }),
          }
        },
      }),
      _calls: calls,
    },
  }
}

function reqWithCookie(method, url = 'http://x/', body) {
  const init = { method, headers: { cookie: 'sb_session=t' } }
  if (body !== undefined) {
    init.headers['content-type'] = 'application/json'
    init.body = JSON.stringify(body)
  }
  return new Request(url, init)
}

describe('GET /api/posts/mine', () => {
  it('rejects unauthenticated', async () => {
    const env = makeEnv({ user: null })
    const res = await onListMine({ request: new Request('http://x/'), env })
    expect(res.status).toBe(401)
  })

  it('returns posts filtered by author_id', async () => {
    const env = makeEnv({ user: sessionUser({ id: 7 }), post: { id: 1, title: 'T' } })
    const res = await onListMine({ request: reqWithCookie('GET'), env })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body.posts)).toBe(true)
    const listCall = env.DB._calls.find((c) => c.sql.includes('FROM posts'))
    expect(listCall.args).toContain(7)
  })
})

describe('GET /api/posts/mine/[id]', () => {
  it('returns 404 when post not owned by user', async () => {
    const env = makeEnv({ user: sessionUser({ id: 7 }), post: { id: 1, title: 'T' }, ownerId: 99 })
    const res = await onGetOne({ request: reqWithCookie('GET'), env, params: { id: '1' } })
    expect(res.status).toBe(404)
  })

  it('returns the post when owned', async () => {
    const env = makeEnv({
      user: sessionUser({ id: 7 }),
      post: { id: 1, title: 'T', status: 'pending', content_html: '<p>x</p>' },
      ownerId: 7,
    })
    const res = await onGetOne({ request: reqWithCookie('GET'), env, params: { id: '1' } })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.post.id).toBe(1)
  })
})

describe('PATCH /api/posts/mine/[id]', () => {
  it('rejects PATCH on non-pending post (409)', async () => {
    const env = makeEnv({
      user: sessionUser({ id: 7 }),
      post: { id: 1, title: 'T', status: 'published', content_html: '<p>x</p>' },
      ownerId: 7,
    })
    const res = await onRequestPatch({
      request: reqWithCookie('PATCH', 'http://x/', { title: 'New' }),
      env,
      params: { id: '1' },
    })
    expect(res.status).toBe(409)
  })

  it('rejects PATCH on post owned by another user (404)', async () => {
    const env = makeEnv({
      user: sessionUser({ id: 7 }),
      post: { id: 1, title: 'T', status: 'pending', content_html: '<p>x</p>' },
      ownerId: 99,
    })
    const res = await onRequestPatch({
      request: reqWithCookie('PATCH', 'http://x/', { title: 'New' }),
      env,
      params: { id: '1' },
    })
    expect(res.status).toBe(404)
  })

  it('allows PATCH on own pending post', async () => {
    const env = makeEnv({
      user: sessionUser({ id: 7 }),
      post: { id: 1, title: 'Old', status: 'pending', content_html: '<p>old</p>', slug: 'old' },
      ownerId: 7,
    })
    const res = await onRequestPatch({
      request: reqWithCookie('PATCH', 'http://x/', { title: 'New', content_html: '<p>new</p>' }),
      env,
      params: { id: '1' },
    })
    expect(res.status).toBe(200)
    const update = env.DB._calls.find((c) => c.sql.includes('UPDATE posts SET'))
    expect(update).toBeDefined()
  })

  it('sanitizes title and content on PATCH', async () => {
    const env = makeEnv({
      user: sessionUser({ id: 7 }),
      post: { id: 1, title: 'Old', status: 'pending', content_html: '<p>old</p>', slug: 'old' },
      ownerId: 7,
    })
    await onRequestPatch({
      request: reqWithCookie('PATCH', 'http://x/', {
        title: '<script>x</script>New',
        content_html: '<p>ok</p><script>alert(1)</script>',
      }),
      env,
      params: { id: '1' },
    })
    const update = env.DB._calls.find((c) => c.sql.includes('UPDATE posts SET'))
    expect(update.args.some((a) => typeof a === 'string' && a.includes('<script>'))).toBe(false)
  })
})

describe('DELETE /api/posts/mine/[id]', () => {
  it('rejects DELETE on non-pending post (409)', async () => {
    const env = makeEnv({
      user: sessionUser({ id: 7 }),
      post: { id: 1, title: 'T', status: 'published' },
      ownerId: 7,
    })
    const res = await onRequestDelete({ request: reqWithCookie('DELETE'), env, params: { id: '1' } })
    expect(res.status).toBe(409)
  })

  it('rejects DELETE on post not owned (404)', async () => {
    const env = makeEnv({
      user: sessionUser({ id: 7 }),
      post: { id: 1, title: 'T', status: 'pending' },
      ownerId: 99,
    })
    const res = await onRequestDelete({ request: reqWithCookie('DELETE'), env, params: { id: '1' } })
    expect(res.status).toBe(404)
  })

  it('deletes own pending post', async () => {
    const env = makeEnv({
      user: sessionUser({ id: 7 }),
      post: { id: 1, title: 'T', status: 'pending' },
      ownerId: 7,
    })
    const res = await onRequestDelete({ request: reqWithCookie('DELETE'), env, params: { id: '1' } })
    expect(res.status).toBe(200)
    const del = env.DB._calls.find((c) => c.sql.includes('DELETE FROM posts'))
    expect(del).toBeDefined()
  })
})
