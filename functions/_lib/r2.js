const ALLOWED_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

const MAX_BYTES = 5 * 1024 * 1024

export function validateImage(file) {
  if (!file || typeof file === 'string') return { error: 'No file' }
  const ext = ALLOWED_TYPES[file.type]
  if (!ext) return { error: 'Type not allowed (jpg, png, webp, gif only)' }
  if (file.size > MAX_BYTES) return { error: 'File too large (max 5 MB)' }
  return { ext }
}

export function makeKey(ext) {
  return `images/${crypto.randomUUID()}.${ext}`
}

export function publicUrl(key) {
  return `/r2/${key}`
}
