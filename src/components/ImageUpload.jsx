import { useRef, useState } from 'react'
import { Upload, X } from 'lucide-react'

export default function ImageUpload({ value, onChange, label = 'Image' }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  const upload = async (file) => {
    if (!file) return
    setError(null)
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const r = await fetch('/api/admin/upload', {
        method: 'POST',
        credentials: 'include',
        body: fd,
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Upload failed')
      onChange(data.url)
    } catch (e) {
      setError(e.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="image-upload">
      <span className="image-upload-label">{label}</span>
      {value && (
        <div className="image-upload-preview">
          <img src={value} alt="" />
          <button
            type="button"
            className="image-upload-remove"
            onClick={() => onChange('')}
            aria-label="Retirer l'image"
          >
            <X size={16} />
          </button>
        </div>
      )}
      <div className="image-upload-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          <Upload size={16} />
          <span>{uploading ? 'Envoi…' : value ? 'Remplacer' : 'Téléverser une image'}</span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) upload(f)
            e.target.value = ''
          }}
        />
      </div>
      <input
        type="text"
        className="image-upload-url"
        placeholder="… ou coller une URL d'image"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <p className="auth-error">{error}</p>}
    </div>
  )
}
