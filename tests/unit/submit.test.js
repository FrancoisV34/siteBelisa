import { describe, it, expect, vi, beforeEach } from 'vitest'
import { onRequestPost } from '../../functions/api/posts/submit.js'

function makeEnv({ user = null, pendingCount = 0, slugTaken = false } = {}) {
  const calls = []
  const sessionRow = user
    ? { id: user.id, email: user.email, display_name: 'X', role: user.role || 'user', status: 'active', token: 't' }
    : null
  return {
    DB: {
      prepare: (sql) => ({
        bind: (...args) => {
          calls.push({ sql, args })
          return {
            first: async () => {
              if (sql.includes('FROM sessions s JOIN users u')) return sessionRow
              if (sql.includes('COUNT(*)')) return { n: pendingCount }
              if (sql.includes('FROM posts WHERE slug')) return slugTaken ? { id: 1 } : null
              return null
            },
            run: async () => ({ meta: { last_row_id: 42 } }),
            all: async () => ({ results: [] }),
          }
        },
      }),
      _calls: calls,
    },
  }
}

function makeReq(body) {
  return new Request('http://x/api/posts/submit', {
    method: 'POST',
    headers: { cookie: 'sb_session=token', 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/posts/submit', () => {
  let env
  beforeEach(() => { env = makeEnv({ user: { id: 7 } }) })

  it('rejects unauthenticated requests', async () => {
    const noAuthEnv = makeEnv({ user: null })
    const res = await onRequestPost({
      request: new Request('http://x/', { method: 'POST', body: '{}' }),
      env: noAuthEnv,
    })
    expect(res.status).toBe(401)
  })

  it('creates a pending post on valid input', async () => {
    const res = await onRequestPost({
      request: makeReq({ title: 'Hello', content_html: '<p>body</p>' }),
      env,
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.post).toMatchObject({ id: 42, status: 'pending', title: 'Hello' })
    const insert = env.DB._calls.find((c) => c.sql.includes('INSERT INTO posts'))
    expect(insert).toBeDefined()
    expect(insert.sql).toContain("'pending'")
    expect(insert.args[0]).toBe(7)
  })

  it('forces status=pending and ignores any client-supplied status', async () => {
    const res = await onRequestPost({
      request: makeReq({ title: 'X', content_html: '<p>x</p>', status: 'published' }),
      env,
    })
    expect(res.status).toBe(200)
    const insert = env.DB._calls.find((c) => c.sql.includes('INSERT INTO posts'))
    expect(insert.sql).toContain("'pending'")
    expect(insert.args).not.toContain('published')
  })

  it('sanitizes title (strips HTML)', async () => {
    await onRequestPost({
      request: makeReq({ title: '<script>x</script>Hello', content_html: '<p>ok</p>' }),
      env,
    })
    const insert = env.DB._calls.find((c) => c.sql.includes('INSERT INTO posts'))
    const titleArg = insert.args[2]
    expect(titleArg).not.toContain('script')
    expect(titleArg).toBe('Hello')
  })

  it('sanitizes content_html (strips script)', async () => {
    await onRequestPost({
      request: makeReq({ title: 'T', content_html: '<p>ok</p><script>alert(1)</script>' }),
      env,
    })
    const insert = env.DB._calls.find((c) => c.sql.includes('INSERT INTO posts'))
    const contentArg = insert.args[3]
    expect(contentArg).not.toContain('script')
    expect(contentArg).toContain('<p>ok</p>')
  })

  it('rejects empty title', async () => {
    const res = await onRequestPost({ request: makeReq({ title: '', content_html: '<p>ok</p>' }), env })
    expect(res.status).toBe(400)
  })

  it('rejects empty content', async () => {
    const res = await onRequestPost({ request: makeReq({ title: 'T', content_html: '' }), env })
    expect(res.status).toBe(400)
  })

  it('rejects title over 200 chars', async () => {
    const res = await onRequestPost({
      request: makeReq({ title: 'a'.repeat(201), content_html: '<p>ok</p>' }),
      env,
    })
    expect(res.status).toBe(400)
  })

  it('returns 429 when user has 5 pending posts', async () => {
    const fullEnv = makeEnv({ user: { id: 7 }, pendingCount: 5 })
    const res = await onRequestPost({
      request: makeReq({ title: 'T', content_html: '<p>ok</p>' }),
      env: fullEnv,
    })
    expect(res.status).toBe(429)
  })

  it('rejects invalid JSON body', async () => {
    const req = new Request('http://x/', {
      method: 'POST',
      headers: { cookie: 'sb_session=t' },
      body: 'not json',
    })
    const res = await onRequestPost({ request: req, env })
    expect(res.status).toBe(400)
  })
})
