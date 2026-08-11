// Downscale and re-encode images in the browser before upload.
//
// Cloudflare's image resizing is a paid add-on and Workers cannot encode images,
// so the only place this can happen for free is the client. Doing it at upload
// time means every image is stored once, already optimized — no per-request work
// and no variant bookkeeping.

const MAX_EDGE = 1600
const WEBP_QUALITY = 0.82

// Animation is lost by a canvas round-trip, so GIFs are passed through as-is.
const SKIP_TYPES = new Set(['image/gif'])

function loadBitmap(file) {
  if (typeof createImageBitmap === 'function') return createImageBitmap(file)

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('decode failed'))
    }
    img.src = url
  })
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
}

/**
 * Returns an optimized File, or the original when optimizing would not help.
 *
 * Never throws: a failure here must not block an upload that would otherwise
 * have succeeded, so the original file is returned instead.
 */
export async function optimizeImage(file) {
  if (!file || SKIP_TYPES.has(file.type)) return file

  try {
    const bitmap = await loadBitmap(file)
    const { width, height } = bitmap
    if (!width || !height) return file

    const scale = Math.min(1, MAX_EDGE / Math.max(width, height))
    const targetW = Math.round(width * scale)
    const targetH = Math.round(height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = targetW
    canvas.height = targetH
    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(bitmap, 0, 0, targetW, targetH)
    bitmap.close?.()

    const blob = await canvasToBlob(canvas, 'image/webp', WEBP_QUALITY)
    if (!blob) return file

    // Re-encoding can inflate an already well-compressed file; keep whichever
    // is smaller, unless we also downscaled — then the smaller pixel count wins
    // regardless of byte count.
    if (blob.size >= file.size && scale === 1) return file

    const name = file.name.replace(/\.[^.]+$/, '') + '.webp'
    return new File([blob], name, { type: 'image/webp', lastModified: Date.now() })
  } catch {
    return file
  }
}

export function formatBytes(n) {
  if (n < 1024) return `${n} o`
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} Ko`
  return `${(n / (1024 * 1024)).toFixed(1)} Mo`
}

export { MAX_EDGE }
