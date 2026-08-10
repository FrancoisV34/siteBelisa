// Timestamps are stored as Unix seconds in D1.

export function formatDate(ts) {
  if (!ts) return ''
  return new Date(ts * 1000).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Machine-readable form for <time datetime="…">. Search engines read this
// attribute rather than the localized text next to it.
export function isoDate(ts) {
  if (!ts) return undefined
  return new Date(ts * 1000).toISOString()
}
