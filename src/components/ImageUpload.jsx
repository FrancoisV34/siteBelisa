import { useRef, useState } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'

const ACCEPTED = 'image/jpeg,image/png,image/webp,image/gif'

export default function ImageUpload({ value, onChange, label = 'Image' }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)

  const upload = async (file) => {
    if (!file) return
    setError(null)
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const r = await fetch('/api/upload', {
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

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) upload(file)
  }

  return (
    <div className="image-upload">
      <span className="image-upload-label">{label}</span>

      {value ? (
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
      ) : (
        <button
          type="button"
          className={`image-upload-dropzone ${dragOver ? 'is-dragover' : ''} ${uploading ? 'is-uploading' : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragEnter={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={(e) => { e.preventDefault(); setDragOver(false) }}
          onDrop={handleDrop}
          disabled={uploading}
        >
          {uploading ? (
            <span className="image-upload-hint">Envoi en cours…</span>
          ) : (
            <>
              <ImageIcon size={28} />
              <span className="image-upload-hint">
                <strong>Cliquez</strong> pour parcourir ou <strong>déposez</strong> une image ici
              </span>
              <span className="image-upload-sub">JPG, PNG, WEBP, GIF · max 5 Mo</span>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) upload(f)
          e.target.value = ''
        }}
      />

      {value && (
        <button
          type="button"
          className="btn btn-secondary image-upload-replace"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          <Upload size={16} />
          <span>{uploading ? 'Envoi…' : 'Remplacer'}</span>
        </button>
      )}

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
