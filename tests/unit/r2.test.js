import { describe, it, expect } from 'vitest'
import { validateImage, makeKey, publicUrl } from '../../functions/_lib/r2.js'

describe('validateImage', () => {
  it('accepts a valid jpeg under 5 MB', () => {
    const file = { type: 'image/jpeg', size: 1024 }
    expect(validateImage(file)).toEqual({ ext: 'jpg' })
  })

  it('maps each allowed MIME to the right extension', () => {
    expect(validateImage({ type: 'image/jpeg', size: 10 }).ext).toBe('jpg')
    expect(validateImage({ type: 'image/png', size: 10 }).ext).toBe('png')
    expect(validateImage({ type: 'image/webp', size: 10 }).ext).toBe('webp')
    expect(validateImage({ type: 'image/gif', size: 10 }).ext).toBe('gif')
  })

  it('rejects disallowed MIME types', () => {
    expect(validateImage({ type: 'image/svg+xml', size: 10 }).error).toMatch(/Type not allowed/)
    expect(validateImage({ type: 'application/pdf', size: 10 }).error).toMatch(/Type not allowed/)
    expect(validateImage({ type: 'text/html', size: 10 }).error).toMatch(/Type not allowed/)
  })

  it('rejects files over 5 MB', () => {
    const file = { type: 'image/png', size: 5 * 1024 * 1024 + 1 }
    expect(validateImage(file).error).toMatch(/too large/)
  })

  it('rejects missing or string input', () => {
    expect(validateImage(null).error).toBe('No file')
    expect(validateImage(undefined).error).toBe('No file')
    expect(validateImage('not-a-file').error).toBe('No file')
  })
})

describe('makeKey', () => {
  it('returns images/<uuid>.<ext>', () => {
    const key = makeKey('jpg')
    expect(key).toMatch(/^images\/[0-9a-f-]{36}\.jpg$/i)
  })

  it('produces distinct keys', () => {
    const a = makeKey('png')
    const b = makeKey('png')
    expect(a).not.toBe(b)
  })
})

describe('publicUrl', () => {
  it('prefixes the key with /r2/', () => {
    expect(publicUrl('images/abc.jpg')).toBe('/r2/images/abc.jpg')
  })
})
