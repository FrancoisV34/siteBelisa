import { describe, it, expect } from 'vitest'
import { validateImage, makeKey, publicUrl } from '../../functions/_lib/r2.js'

// File-like objects: minimal shape sufficient for validateImage.
function fakeFile({ type, bytes, size = bytes?.length ?? 0 }) {
  const buffer = bytes ? new Uint8Array(bytes).buffer : new ArrayBuffer(size)
  return {
    type,
    size,
    slice: (start, end) => ({
      arrayBuffer: async () => buffer.slice(start, end),
    }),
  }
}

const SIG_JPEG = [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]
const SIG_PNG  = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]
const SIG_GIF87 = [0x47, 0x49, 0x46, 0x38, 0x37, 0x61, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
const SIG_GIF89 = [0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00]
const SIG_WEBP = [0x52, 0x49, 0x46, 0x46, 0x10, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]

describe('validateImage', () => {
  it('accepts a valid jpeg with matching magic bytes', async () => {
    const f = fakeFile({ type: 'image/jpeg', bytes: SIG_JPEG })
    expect(await validateImage(f)).toEqual({ ext: 'jpg', contentType: 'image/jpeg' })
  })

  it('accepts each declared MIME with its correct signature', async () => {
    expect((await validateImage(fakeFile({ type: 'image/png',  bytes: SIG_PNG  }))).ext).toBe('png')
    expect((await validateImage(fakeFile({ type: 'image/gif',  bytes: SIG_GIF87 }))).ext).toBe('gif')
    expect((await validateImage(fakeFile({ type: 'image/gif',  bytes: SIG_GIF89 }))).ext).toBe('gif')
    expect((await validateImage(fakeFile({ type: 'image/webp', bytes: SIG_WEBP }))).ext).toBe('webp')
  })

  it('rejects MIME spoof: PNG bytes claimed as image/jpeg', async () => {
    const f = fakeFile({ type: 'image/jpeg', bytes: SIG_PNG })
    const r = await validateImage(f)
    expect(r.error).toMatch(/does not match declared type/)
  })

  it('rejects HTML-shaped bytes claiming image/png', async () => {
    const html = [0x3c, 0x21, 0x44, 0x4f, 0x43, 0x54, 0x59, 0x50, 0x45, 0x20, 0x68, 0x74] // "<!DOCTYPE h"
    const f = fakeFile({ type: 'image/png', bytes: html })
    const r = await validateImage(f)
    expect(r.error).toMatch(/not a recognized image/)
  })

  it('rejects disallowed declared MIME', async () => {
    const f = fakeFile({ type: 'image/svg+xml', bytes: SIG_PNG })
    expect((await validateImage(f)).error).toMatch(/Type not allowed/)
    const g = fakeFile({ type: 'application/pdf', bytes: SIG_PNG })
    expect((await validateImage(g)).error).toMatch(/Type not allowed/)
  })

  it('rejects files over 5 MB', async () => {
    const f = fakeFile({ type: 'image/png', bytes: SIG_PNG, size: 5 * 1024 * 1024 + 1 })
    expect((await validateImage(f)).error).toMatch(/too large/)
  })

  it('rejects files smaller than 12 bytes', async () => {
    const f = fakeFile({ type: 'image/png', bytes: [0x89, 0x50] })
    expect((await validateImage(f)).error).toMatch(/too small/)
  })

  it('rejects missing or string input', async () => {
    expect((await validateImage(null)).error).toBe('No file')
    expect((await validateImage(undefined)).error).toBe('No file')
    expect((await validateImage('not-a-file')).error).toBe('No file')
  })
})

describe('makeKey', () => {
  it('returns images/<uuid>.<ext>', () => {
    expect(makeKey('jpg')).toMatch(/^images\/[0-9a-f-]{36}\.jpg$/i)
  })
  it('produces distinct keys', () => {
    expect(makeKey('png')).not.toBe(makeKey('png'))
  })
})

describe('publicUrl', () => {
  it('prefixes the key with /r2/', () => {
    expect(publicUrl('images/abc.jpg')).toBe('/r2/images/abc.jpg')
  })
})
