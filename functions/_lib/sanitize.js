import xss from 'xss'

// Allowlist matching what TipTap (StarterKit + Image + Link) can produce.
// Anything outside this allowlist is stripped before storage.
const RICH_TEXT_OPTIONS = {
  whiteList: {
    p: ['style'],
    br: [],
    strong: [],
    b: [],
    em: [],
    i: [],
    u: [],
    s: [],
    strike: [],
    code: [],
    pre: [],
    blockquote: [],
    ul: [],
    ol: ['start'],
    li: [],
    h1: [],
    h2: [],
    h3: [],
    h4: [],
    h5: [],
    h6: [],
    hr: [],
    a: ['href', 'title'],
    img: ['src', 'alt', 'title', 'width', 'height'],
    span: [],
  },
  stripIgnoreTag: true,        // Remove tags not in allowlist (don't escape them)
  stripIgnoreTagBody: ['script', 'style'], // Strip these tags AND their content
  // Force safe attributes on links and images
  onTagAttr: (tag, name, value, _isWhiteAttr) => {
    if (tag === 'a' && name === 'href') {
      if (!isSafeUrl(value)) return ''
      return `href="${xss.escapeAttrValue(value)}"`
    }
    if (tag === 'img' && name === 'src') {
      if (!isSafeImageSrc(value)) return ''
      return `src="${xss.escapeAttrValue(value)}"`
    }
    return undefined
  },
}

function isSafeUrl(url) {
  if (typeof url !== 'string') return false
  const trimmed = url.trim().toLowerCase()
  if (trimmed.startsWith('javascript:') || trimmed.startsWith('data:') || trimmed.startsWith('vbscript:') || trimmed.startsWith('file:')) {
    return false
  }
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('/') ||  // relative same-origin
    trimmed.startsWith('#')     // anchor
  )
}

function isSafeImageSrc(url) {
  if (typeof url !== 'string') return false
  const trimmed = url.trim().toLowerCase()
  if (trimmed.startsWith('javascript:') || trimmed.startsWith('vbscript:') || trimmed.startsWith('file:')) {
    return false
  }
  // Allow http(s), same-origin paths (including /r2/...), and inline data URIs for images only
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('data:image/')
  )
}

/**
 * Sanitize HTML coming from a TipTap editor before storing in DB.
 * Strips any tag/attribute outside the allowlist and any unsafe URLs.
 */
export function sanitizeRichText(input) {
  if (input == null) return ''
  return xss(String(input), RICH_TEXT_OPTIONS)
}

/**
 * Strip ALL HTML from user-supplied plain text (comments, guestbook).
 * The frontend already escapes via React, but defense in depth: we also
 * remove anything that looks like markup before storage.
 */
export function sanitizePlainText(input) {
  if (input == null) return ''
  return xss(String(input), {
    whiteList: {},
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style'],
  })
}

/**
 * Validate a cover image URL: stricter than `isSafeImageSrc` because the
 * value is rendered into <img src> seen by the moderator (and on /blog).
 * Allowed: https:// or same-origin /r2/ paths only.
 * Rejected: http://, javascript:, data:, vbscript:, protocol-relative //, etc.
 *
 * Returns the trimmed URL if valid, or `null` if invalid/empty.
 * Caller must convert null to a 400 (not silently store).
 */
export function sanitizeCoverImage(input) {
  if (input == null) return null
  const trimmed = String(input).trim().slice(0, 500)
  if (!trimmed) return null
  const lower = trimmed.toLowerCase()
  if (lower.startsWith('https://')) return trimmed
  if (trimmed.startsWith('/r2/')) return trimmed
  return null
}
