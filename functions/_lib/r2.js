// Image upload validation: declared MIME + file size + magic-byte signature.
// Defense-in-depth so a spoofed Content-Type cannot smuggle non-image content
// (e.g. HTML claiming image/png) into R2.

const MAX_BYTES = 5 * 1024 * 1024

const SIGNATURES = [
  // Tuple: [extension, mimeType, matcher(Uint8Array) -> boolean]
  ['jpg', 'image/jpeg', (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff],
  ['png', 'image/png', (b) =>
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
    b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a],
  ['gif', 'image/gif', (b) =>
    b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38 &&
    (b[4] === 0x37 || b[4] === 0x39) && b[5] === 0x61],
  ['webp', 'image/webp', (b) =>
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50],
]

const DECLARED_MIME = new Set(SIGNATURES.map(([, m]) => m))

/**
 * Validate the uploaded file.
 * - Rejects empty / too large / unknown declared MIME.
 * - Reads the first 12 bytes and matches against known image signatures.
 * - Rejects if the detected signature does not match the declared MIME
 *   (prevents Content-Type spoofing).
 *
 * Returns `{ ext, contentType }` where `contentType` is the SERVER-DERIVED
 * MIME from signature detection (NEVER the client-supplied value), to be
 * stored as the R2 object's content-type.
 *
 * Returns `{ error: string }` on any failure.
 */
export async function validateImage(file) {
  if (!file || typeof file === 'string') return { error: 'No file' }
  if (file.size > MAX_BYTES) return { error: 'File too large (max 5 MB)' }
  if (file.size < 12) return { error: 'File too small to be a valid image' }
  if (!DECLARED_MIME.has(file.type)) {
    return { error: 'Type not allowed (jpg, png, webp, gif only)' }
  }

  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  const match = SIGNATURES.find(([, , test]) => test(head))
  if (!match) return { error: 'File content is not a recognized image' }

  const [ext, contentType] = match
  if (contentType !== file.type) {
    return { error: 'Image content does not match declared type' }
  }

  return { ext, contentType }
}

export function makeKey(ext) {
  return `images/${crypto.randomUUID()}.${ext}`
}

export function publicUrl(key) {
  return `/r2/${key}`
}
