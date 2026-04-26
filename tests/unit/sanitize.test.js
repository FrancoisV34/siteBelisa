import { describe, it, expect } from 'vitest'
import { sanitizeRichText, sanitizePlainText } from '../../functions/_lib/sanitize.js'

describe('sanitizeRichText', () => {
  it('keeps allowed TipTap tags untouched', () => {
    const html = '<p><strong>bold</strong> and <em>italic</em></p>'
    expect(sanitizeRichText(html)).toBe(html)
  })

  it('keeps headings, lists, blockquote, code, hr', () => {
    const html = '<h2>Title</h2><ul><li>one</li></ul><blockquote>q</blockquote><pre><code>x</code></pre><hr>'
    const out = sanitizeRichText(html)
    expect(out).toContain('<h2>Title</h2>')
    expect(out).toContain('<ul><li>one</li></ul>')
    expect(out).toContain('<blockquote>')
    expect(out).toContain('<pre>')
  })

  it('strips <script> tags AND their content', () => {
    const out = sanitizeRichText('<p>hi</p><script>alert(1)</script>')
    expect(out).not.toContain('script')
    expect(out).not.toContain('alert')
    expect(out).toContain('<p>hi</p>')
  })

  it('strips <style> tags AND their content', () => {
    const out = sanitizeRichText('<style>body{display:none}</style><p>ok</p>')
    expect(out).not.toContain('style')
    expect(out).not.toContain('display:none')
    expect(out).toContain('<p>ok</p>')
  })

  it('strips <iframe>, <object>, <embed>, <form>', () => {
    expect(sanitizeRichText('<iframe src="x"></iframe>')).not.toContain('iframe')
    expect(sanitizeRichText('<object data="x"></object>')).not.toContain('object')
    expect(sanitizeRichText('<embed src="x">')).not.toContain('embed')
    expect(sanitizeRichText('<form><input></form>')).not.toContain('<form')
  })

  it('strips event handlers', () => {
    const out = sanitizeRichText('<p onclick="alert(1)">x</p>')
    expect(out).not.toContain('onclick')
    expect(out).not.toContain('alert')
  })

  it('strips javascript: hrefs', () => {
    const out = sanitizeRichText('<a href="javascript:alert(1)">link</a>')
    expect(out).not.toContain('javascript:')
    expect(out).not.toContain('alert')
  })

  it('strips data: hrefs', () => {
    const out = sanitizeRichText('<a href="data:text/html,<script>x</script>">link</a>')
    expect(out).not.toContain('data:')
  })

  it('keeps safe http/https/relative hrefs', () => {
    expect(sanitizeRichText('<a href="https://example.com">x</a>')).toContain('href="https://example.com"')
    expect(sanitizeRichText('<a href="/about">x</a>')).toContain('href="/about"')
    expect(sanitizeRichText('<a href="mailto:a@b.c">x</a>')).toContain('href="mailto:a@b.c"')
  })

  it('strips target and rel attributes from links (avoid window-opener attacks)', () => {
    const out = sanitizeRichText('<a href="https://example.com" target="_blank" rel="opener">x</a>')
    expect(out).not.toContain('target')
    expect(out).not.toContain('rel=')
    expect(out).toContain('href="https://example.com"')
  })

  it('strips javascript: image src', () => {
    const out = sanitizeRichText('<img src="javascript:alert(1)">')
    expect(out).not.toContain('javascript:')
  })

  it('keeps safe image sources (https, /r2/, data:image/)', () => {
    expect(sanitizeRichText('<img src="https://example.com/x.png">')).toContain('src="https://example.com/x.png"')
    expect(sanitizeRichText('<img src="/r2/images/a.jpg">')).toContain('src="/r2/images/a.jpg"')
    expect(sanitizeRichText('<img src="data:image/png;base64,iVBOR...">')).toContain('src="data:image/png;base64,')
  })

  it('rejects data:text/html as image source', () => {
    const out = sanitizeRichText('<img src="data:text/html,<script>x</script>">')
    expect(out).not.toContain('data:text/html')
  })

  it('handles null and undefined safely', () => {
    expect(sanitizeRichText(null)).toBe('')
    expect(sanitizeRichText(undefined)).toBe('')
  })

  it('coerces non-string input', () => {
    expect(sanitizeRichText(42)).toBe('42')
  })
})

describe('sanitizePlainText', () => {
  it('strips all HTML tags', () => {
    expect(sanitizePlainText('<p>hello</p>')).toBe('hello')
    expect(sanitizePlainText('<b>bold</b>')).toBe('bold')
  })

  it('strips <script> AND its content', () => {
    expect(sanitizePlainText('hi<script>alert(1)</script>')).toBe('hi')
  })

  it('strips <style> AND its content', () => {
    expect(sanitizePlainText('hi<style>x{}</style>')).toBe('hi')
  })

  it('preserves plain text including special characters', () => {
    expect(sanitizePlainText('Hello, world! "café" — naïve')).toBe('Hello, world! "café" — naïve')
  })

  it('handles null/undefined safely', () => {
    expect(sanitizePlainText(null)).toBe('')
    expect(sanitizePlainText(undefined)).toBe('')
  })

  it('coerces numbers', () => {
    expect(sanitizePlainText(123)).toBe('123')
  })

  it('strips event handlers when present in malformed input', () => {
    const out = sanitizePlainText('<img src=x onerror=alert(1)>')
    expect(out).not.toContain('onerror')
    expect(out).not.toContain('alert')
  })
})
